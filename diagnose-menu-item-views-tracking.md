# TABBLED — DIAGNOSE: Why `menu_item_views` Tracking Doesn't Fire

## PROJECT CONTEXT

- Tabbled production SaaS, Ramada Encore live customer
- VPS: `/opt/khp/tabbled/` on `root@168.119.234.186`
- Stack: React + Vite + TypeScript + Supabase
- Supabase project: `qmnrawqvkwehufebbkxp`
- Today is April 22, 2026. Launch: May 15.

## THE PROBLEM

The `menu_item_views` table is supposed to record which products customers open in the product detail modal on the public menu, and how long they look at it. The admin Dashboard has 4 cards ("Most Viewed Item", "Product Clicks", "Category Performance", "Top 5 Items") that aggregate from this table.

**All 4 cards show empty state in production.** Supabase confirms `SELECT COUNT(*) FROM menu_item_views` returns 0 rows. Tracking code is believed to exist around `PublicMenu.tsx:2115-2129`. It is supposed to fire on modal close with a `2 <= duration_seconds <= 300` filter.

**Manual reproduction (April 20):**
1. User opened Ramada menu in browser
2. Opened several product detail modals
3. Waited 3+ seconds in each
4. Closed the modal
5. Checked browser Network tab: **no INSERT request to `menu_item_views`**
6. Checked browser Console: **no log, no error**
7. Checked Supabase Table Editor: **still 0 rows**

So the tracking is not rejecting at the server — it's not even sending.

## WHY THIS IS A DIAGNOSE-ONLY TASK

Do NOT attempt any fix in this run. The goal is purely to understand where and why the tracking dies. A bad fix on a silent failure creates TWO bugs to unwind. Fix prompt will come separately after we see your report.

---

## TASK — READ-ONLY INVESTIGATION

### Q1 — Where does the tracking code actually live?

```bash
cd /opt/khp/tabbled
grep -rn "menu_item_views" src/ supabase/ --include="*.ts" --include="*.tsx" --include="*.sql"
```

Report **every** occurrence. For each:
- File path + line number
- Surrounding function / component name
- Whether it's: SELECT (read), INSERT (write), table definition, RPC call, or RLS policy reference

### Q2 — What's the full tracking effect?

Read `src/pages/PublicMenu.tsx` around the tracking code (likely lines 2080–2160, but use Q1 output to confirm exact range). Report:

- The full `useEffect` or event handler block that performs the INSERT
- What triggers it (mount, unmount, explicit onClose callback, state change?)
- What the dependency array contains (if `useEffect`)
- What state is read at the moment of INSERT (`selectedItem`, `modalOpen`, `startTime`, `fingerprint`, etc.)
- The exact INSERT payload structure passed to Supabase

Quote the relevant code verbatim (15-40 lines max — we need to see it, not summarize it).

### Q3 — How does the product detail modal mount and unmount?

In the same file, find where the modal is rendered. Report:

- Is it **conditional render** (`{selectedItem && <Modal .../>}`)? → unmount fires cleanup
- Or **always rendered** with `display: none` / CSS hide when closed? → cleanup never fires
- Or rendered via a Radix/shadcn Dialog component? → different lifecycle
- Is there an explicit `onClose` / `onOpenChange` callback on the modal?

This is the single most likely root cause — if the modal uses CSS hide instead of conditional render, `useEffect` cleanup never runs, and tracking never INSERTs.

### Q4 — Does `getFingerprint()` (or equivalent) work?

Find whatever function generates the anonymous fingerprint / visitor ID used in the INSERT payload. Report:
- Where it's defined
- What it returns (string? promise?)
- Whether it's resolved synchronously or async
- Whether the tracking effect correctly awaits it if async

A common failure mode: fingerprint is a Promise, INSERT runs before it resolves, Supabase rejects on null fingerprint (if NOT NULL constraint), or silently succeeds with null (if nullable).

### Q5 — What are the RLS policies on `menu_item_views`?

Run (locally, against the production-linked DB):

```bash
supabase db dump --linked --schema public -f /tmp/schema-check.sql 2>&1 | tail -5
grep -A 3 "menu_item_views" /tmp/schema-check.sql | head -60
```

Report:
- Table definition (columns, NOT NULL constraints)
- Any `CREATE POLICY` statements targeting `menu_item_views`
- Any GRANT statements (anon / authenticated roles)

Critical: does the `anon` role have INSERT permission? Is there an RLS policy that actually allows anonymous INSERT, or does it silently reject without logging?

### Q6 — Is there anything in the browser-side Supabase client setup that filters this call?

```bash
grep -rn "supabase\s*=\|createClient" src/lib/ src/pages/PublicMenu.tsx --include="*.ts" --include="*.tsx" | head -20
```

Report:
- How the client is initialized (public anon key? session-bound?)
- Which client is used for the `menu_item_views` INSERT — public (anon) client or session client?
- If session client: customer is anonymous, there's no session, INSERT would fail with missing auth

### Q7 — Dependency / timing check on the effect

From Q2's code block, walk through this scenario mentally and report what happens:

1. User opens menu page (menu renders, no modal yet)
2. User clicks product card → modal opens with `selectedItem = {...}`
3. User waits 5 seconds
4. User clicks X → modal closes, `selectedItem = null`

At step 4, does the tracking effect:
- Fire? (if yes, why is the INSERT not showing in Network tab?)
- Not fire? (if no, why — what stops it?)

Specifically check: **if the tracking effect reads `selectedItem` but `selectedItem` is already `null` by the time the cleanup runs, the INSERT payload has no item_id and fails silently.** This is a classic stale closure / timing bug.

---

## HOW TO REPORT

Structure your reply as:

```
### Q1 — Occurrences of menu_item_views
[grep output, categorized]

### Q2 — Tracking effect code
[verbatim code block + description of trigger + dependency array]

### Q3 — Modal mount/unmount strategy
[answer: conditional render / CSS hide / Radix Dialog / other]

### Q4 — Fingerprint function
[location, return type, sync/async, whether awaited]

### Q5 — RLS and permissions
[table definition + policies + grants]

### Q6 — Client setup
[which client does the INSERT]

### Q7 — Timing analysis
[walk through the scenario]

### Hypothesis
[your best guess at root cause, 2-4 sentences, given what you found]

### Suggested fix direction
[NOT a fix — just the direction you'd take, e.g. "move INSERT from useEffect cleanup to explicit onClose callback" or "add RLS INSERT policy for anon role". No code edits.]
```

---

## RULES

1. Zero file edits. No `str_replace`. No `create_file` except if explicitly needed for a scratch report (not needed here — paste findings directly).
2. No commit. No push. No migrations.
3. If a finding is uncertain, say so explicitly. Do not guess.
4. If Q5 or Q6 need Supabase Dashboard access that CLI can't do, report what's missing.
5. Quote code verbatim when asked — summaries hide bugs.
