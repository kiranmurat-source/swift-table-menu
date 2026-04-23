# TABBLED — Notification System (Phase 2 — Revised)

## CONTEXT

Phase 1 consolidated the navbar. The existing `notifications` table was discovered with proper schema and RLS, BUT no INSERT mechanism — table is empty in production, dropdown shows nothing.

This Phase 2 connects the pipes: DB triggers populate `notifications` from 3 source tables, Realtime publishes inserts, client subscribes and plays sound for waiter calls. No new table needed.

## ARCHITECTURE (FINAL)

```
[ waiter_calls INSERT ] ──trigger──┐
[ feedback INSERT ]    ──trigger──┼─► [ notifications ] ──Realtime──► Client (already reads)
[ reviews INSERT ]     ──trigger──┘                                         │
                                                                            └─► play sound if type='waiter_call'
```

**Why this is better than the previous Phase 2 design:**
- Single source of truth — one query, not three
- DB-level guarantee — no client gap if browser is closed
- Existing dropdown already reads from this table, no client refactor for fetch logic
- RLS already correct (restaurant scoping + super admin bypass)
- `is_read` already on the table, no separate `notification_reads` table needed

---

## EXISTING SCHEMA (verified, do not recreate)

```
notifications
  id              uuid PK             default gen_random_uuid()
  restaurant_id   uuid                nullable
  type            text                NOT NULL   ('waiter_call' | 'feedback' | 'review')
  title           text                NOT NULL
  message         text                nullable
  is_read         boolean             default false
  metadata        jsonb               default '{}'
  created_at      timestamptz         default now()

RLS policies (already in place):
  - "Anon insert" (any anon can INSERT — needed for triggers via SECURITY DEFINER, OK)
  - "Restaurant owner select" — restaurant_id matches user's profile
  - "Restaurant owner update read" — same scoping for is_read updates
  - "Super admin full access"
```

---

## STEP 1 — DB TRIGGERS (MANUAL — Murat runs in Supabase SQL Editor)

This SQL is NOT executed by Claude Code. Murat copies it into Supabase Dashboard → SQL Editor and runs.

```sql
-- ============================================================
-- TABBLED — Notification triggers (3 sources → notifications)
-- ============================================================

-- 1. waiter_calls INSERT → notifications
CREATE OR REPLACE FUNCTION public.notify_waiter_call()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (restaurant_id, type, title, message, metadata)
  VALUES (
    NEW.restaurant_id,
    'waiter_call',
    CASE WHEN NEW.call_type = 'bill' THEN 'Hesap istendi' ELSE 'Garson çağrısı' END,
    'Masa ' || COALESCE(NEW.table_number, '?'),
    jsonb_build_object(
      'source_id', NEW.id,
      'table_number', NEW.table_number,
      'call_type', NEW.call_type
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_waiter_call ON public.waiter_calls;
CREATE TRIGGER trg_notify_waiter_call
  AFTER INSERT ON public.waiter_calls
  FOR EACH ROW EXECUTE FUNCTION public.notify_waiter_call();

-- 2. feedback INSERT → notifications
CREATE OR REPLACE FUNCTION public.notify_feedback()
RETURNS TRIGGER AS $$
DECLARE
  v_message TEXT;
BEGIN
  -- Build message: prefer comment snippet, fallback to rating
  IF NEW.comment IS NOT NULL AND length(trim(NEW.comment)) > 0 THEN
    v_message := left(NEW.comment, 80);
  ELSIF NEW.rating IS NOT NULL THEN
    v_message := NEW.rating::text || '/5 puan';
  ELSE
    v_message := 'Yorum bırakıldı';
  END IF;

  INSERT INTO public.notifications (restaurant_id, type, title, message, metadata)
  VALUES (
    NEW.restaurant_id,
    'feedback',
    'Yeni geri bildirim',
    v_message,
    jsonb_build_object(
      'source_id', NEW.id,
      'rating', NEW.rating,
      'customer_name', NEW.customer_name,
      'table_number', NEW.table_number
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_feedback ON public.feedback;
CREATE TRIGGER trg_notify_feedback
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_feedback();

-- 3. reviews INSERT → notifications (only when status='pending')
CREATE OR REPLACE FUNCTION public.notify_review()
RETURNS TRIGGER AS $$
DECLARE
  v_message TEXT;
BEGIN
  -- Only notify on pending reviews (admin moderation needed)
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  IF NEW.comment IS NOT NULL AND length(trim(NEW.comment)) > 0 THEN
    v_message := left(NEW.comment, 80);
  ELSIF NEW.rating IS NOT NULL THEN
    v_message := NEW.rating::text || '/5 puan';
  ELSE
    v_message := 'Onay bekliyor';
  END IF;

  INSERT INTO public.notifications (restaurant_id, type, title, message, metadata)
  VALUES (
    NEW.restaurant_id,
    'review',
    'Yeni yorum (onay bekliyor)',
    v_message,
    jsonb_build_object(
      'source_id', NEW.id,
      'rating', NEW.rating,
      'customer_name', NEW.customer_name,
      'table_number', NEW.table_number
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_review ON public.reviews;
CREATE TRIGGER trg_notify_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_review();

-- ============================================================
-- Enable Realtime on notifications
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

After running, verify in SQL editor:

```sql
-- Confirm triggers exist
SELECT tgname, tgrelid::regclass FROM pg_trigger
WHERE tgname LIKE 'trg_notify_%';

-- Confirm notifications is in realtime publication
SELECT tablename FROM pg_publication_tables
WHERE pubname='supabase_realtime' AND tablename='notifications';

-- Smoke test — insert a fake waiter call, check notification appears
-- (use a real restaurant_id from your restaurants table)
-- INSERT INTO waiter_calls (restaurant_id, table_number, call_type, status)
-- VALUES ('PASTE-REAL-RESTAURANT-UUID', 'TEST', 'waiter', 'pending');
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
-- DELETE FROM notifications WHERE message='Masa TEST'; -- clean up
```

---

## STEP 2 — SOUND FILE

`public/sounds/notification.mp3` — short ding, ~0.3s, ~5-10 KB. Source: freesound.org (CC0).

Murat will provide separately. If file missing, code's try/catch silently fails. Add `public/sounds/README.md`:

```
notification.mp3 — short ding sound for waiter call alerts.
~0.3s, ~5-10 KB, professional tone. Source: freesound.org (CC0).
```

---

## STEP 3 — REALTIME SUBSCRIPTION + SOUND IN DASHBOARD.tsx

Locate the existing notification dropdown logic in `src/pages/Dashboard.tsx` (Phase 1 either left it there or moved it to a child component).

Find where notifications are fetched (likely a `useEffect` with `supabase.from('notifications').select()`). After that effect, add a second `useEffect` for realtime + sound.

```typescript
import { useRef } from 'react';

// near other refs
const audioRef = useRef<HTMLAudioElement | null>(null);

// initialize audio once
useEffect(() => {
  audioRef.current = new Audio('/sounds/notification.mp3');
  audioRef.current.volume = 0.6;
  audioRef.current.preload = 'auto';
}, []);

// realtime subscription on notifications
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel(`notifications-realtime-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        const newNotif = payload.new as any;

        // Sound for waiter calls only
        if (newNotif.type === 'waiter_call' && audioRef.current) {
          try {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
              // Browser may block autoplay before user interaction — silent fail
            });
          } catch (e) {
            // Ignore
          }
        }

        // Refetch notifications list (RLS will filter to this user's restaurant automatically)
        // Replace `fetchNotifications` with the actual existing fetch function name from your code
        fetchNotifications();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

**IMPORTANT:** Inspect existing code first to find the actual fetch function name (might be `loadNotifications`, `refreshNotifications`, etc.). Don't introduce a duplicate fetch.

---

## STEP 4 — CONDITIONAL BELL RENDER (role-based)

The bell should only render for restaurant users. SuperAdmin sees centered logo only, no bell.

Find the bell button JSX in the consolidated top bar (placed there in Phase 1) and wrap it:

```tsx
{user?.role === 'restaurant' && (
  <div style={{ position: 'relative' }}>
    {/* existing bell button + dropdown */}
  </div>
)}
```

Adjust based on how `user.role` is actually stored — might be `profile.role` or fetched separately. Check existing `is_super_admin()` usage in the codebase for the canonical pattern.

---

## STEP 5 — "TÜMÜNÜ GÖR" PAGE (Bildirimler tab)

Add a new sidebar item "Bildirimler" or a route `/dashboard/bildirimler` that lists all notifications full-page.

Minimum viable implementation:
- Reuse existing `notifications` table query but raise `limit(20)` to `limit(100)`
- Vertical list using same row design as the dropdown
- Filter chips at top: `Tümü` / `Çağrılar` / `Geri Bildirim` / `Yorumlar` (filter by `type` column client-side)
- "Tümünü okundu işaretle" button (already exists in dropdown — reuse)
- Empty state: "Henüz bildirim yok"

Place it in the sidebar under "Müşteri İlişkileri" group, between "Çağrılar" and "Geri Bildirim", or as its own item with a Bell Thin icon.

---

## STEP 6 — METADATA-AWARE NAVIGATION

When user clicks a notification row in the dropdown, navigate to the relevant tab AND mark as read. The notification's `metadata.source_id` can be used to scroll to or highlight the specific row in the destination tab (optional — Phase 2.5 polish).

```typescript
const handleNotificationClick = async (notif) => {
  // Mark read via existing markAsRead handler
  await markAsRead(notif.id);
  setBellOpen(false);

  // Route by type
  if (notif.type === 'waiter_call') {
    setActiveTab('waiter-calls');
  } else if (notif.type === 'feedback') {
    setActiveTab('feedback');
  } else if (notif.type === 'review') {
    setActiveTab('reviews'); // adjust to actual tab key
  }

  // Optional: pass source_id via state for highlight
  // sessionStorage.setItem('highlightNotificationSource', notif.metadata?.source_id);
};
```

---

## STEP 7 — UNREAD BADGE STYLE (Phase 1 polish)

If Phase 1 already added the bell with badge, verify badge styling:

```tsx
{unreadCount > 0 && (
  <span
    style={{
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      padding: '0 4px',
      background: '#EF4444',
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
```

---

## BUILD & DEPLOY

```bash
cd /opt/khp/tabbled
npm run build
```

Show diff to Murat before pushing. After approval:

```bash
git add -A
git commit -m "feat(notifications): realtime subscription + sound alert for waiter calls, conditional bell render for restaurant role only, all-notifications page"
git push origin main
```

---

## TEST CHECKLIST

After deploy + DB triggers + Realtime enabled + sound file uploaded:

- [ ] Trigger a waiter call from public menu (any test restaurant) → check `notifications` table receives a row within 1s
- [ ] Bell badge in admin dashboard increments WITHOUT page refresh (within 1-2 sec)
- [ ] Sound plays on new waiter call (after first user interaction with the page)
- [ ] Submit a feedback from public menu → bell badge increments, no sound
- [ ] Submit a review (status='pending') → bell badge increments, no sound
- [ ] Click notification row → marks read, dropdown closes, navigates to correct tab
- [ ] "Tümünü okundu işaretle" works
- [ ] "Bildirimler" sidebar item opens full-page list
- [ ] Filter chips work (Tümü / Çağrılar / Geri Bildirim / Yorumlar)
- [ ] SuperAdmin login → no bell visible (only centered logo)
- [ ] Restaurant user login → bell visible
- [ ] Read state persists after page reload
- [ ] Different restaurant accounts have isolated notifications (RLS verified)
- [ ] Multiple browser tabs open as same user → both receive realtime updates

---

## ROLLBACK

Code rollback:
```bash
git revert HEAD
git push origin main
```

DB rollback (Supabase SQL Editor):
```sql
DROP TRIGGER IF EXISTS trg_notify_waiter_call ON public.waiter_calls;
DROP TRIGGER IF EXISTS trg_notify_feedback ON public.feedback;
DROP TRIGGER IF EXISTS trg_notify_review ON public.reviews;
DROP FUNCTION IF EXISTS public.notify_waiter_call();
DROP FUNCTION IF EXISTS public.notify_feedback();
DROP FUNCTION IF EXISTS public.notify_review();
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
-- Optionally clean up generated test data:
-- DELETE FROM public.notifications WHERE created_at > 'YYYY-MM-DD';
```
