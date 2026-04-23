# TABBLED — Splash Cover Video Mobile Autoplay Fix

## CONTEXT

The splash screen cover video (restaurants.cover_url with .mp4/.webm) auto-plays on desktop but shows a play button on mobile (iOS Safari + Android Chrome). User sees frozen first frame with center play icon.

This is a mobile autoplay policy issue. Mobile browsers require ALL three conditions for autoplay:
1. `muted` attribute (mandatory — without it iOS NEVER autoplays)
2. `playsInline` attribute (iOS requirement — without it iOS tries fullscreen and fails)
3. `autoPlay` attribute

Bug pattern: One of these is missing OR they are set in wrong order OR `<source>` tag is missing `type` attribute.

---

## TASK

Fix the splash cover video so it autoplays silently on iOS Safari, Android Chrome, and desktop browsers.

---

## STEP 1: LOCATE THE SPLASH COVER VIDEO RENDER

```bash
cd /opt/khp/tabbled
grep -rn "cover_url" src/pages/PublicMenu.tsx | head -20
grep -rn "cover_url" src/ --include="*.tsx" | head -30
```

Find where `restaurant.cover_url` is rendered in the splash screen (NOT the category bento card — that one already works). Look for the splash/hero section that shows before "Menüyü Görüntüle" button.

It's likely either:
- An `<img>` tag (which means video URLs render as broken images and browser falls back to default media controls — explains the play button overlay)
- A `<video>` tag with incomplete attributes

---

## STEP 2: DETECT FILE TYPE AND RENDER ACCORDINGLY

The `cover_url` field can be either an image (.jpg/.png/.webp) or a video (.mp4/.webm). We need to detect and render the correct element.

Add a helper function near the top of PublicMenu.tsx (or in a utils file):

```typescript
const isVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0]; // strip query string
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');
};

const getVideoMimeType = (url: string): string => {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'video/mp4';
};
```

---

## STEP 3: REPLACE THE COVER RENDER WITH PROPER VIDEO/IMAGE SWITCH

Find the splash cover render block. It probably looks something like:

```tsx
{restaurant.cover_url && (
  <img
    src={restaurant.cover_url}
    alt=""
    className="..."
  />
)}
```

OR it might already be a `<video>` but missing critical attributes.

Replace with this exact pattern — DO NOT change attribute order, DO NOT remove any attribute:

```tsx
{restaurant.cover_url && (
  isVideoUrl(restaurant.cover_url) ? (
    <video
      key={restaurant.cover_url}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      controls={false}
      poster={restaurant.logo_url || undefined}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ pointerEvents: 'none' }}
      onLoadedMetadata={(e) => {
        // iOS sometimes needs an explicit play() call after metadata load
        const v = e.currentTarget;
        v.muted = true; // belt-and-suspenders for iOS
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked — silently ignore, video will show first frame
          });
        }
      }}
    >
      <source src={restaurant.cover_url} type={getVideoMimeType(restaurant.cover_url)} />
    </video>
  ) : (
    <img
      src={restaurant.cover_url}
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
)}
```

### CRITICAL — DO NOT SKIP ANY OF THESE:

1. **`muted` MUST be present as a JSX boolean attribute** — `<video muted ...>` not `<video muted={true}>` (both work but the boolean form is safer for SSR/hydration edge cases)
2. **`playsInline`** (camelCase in JSX) — translates to HTML `playsinline` attribute — iOS REQUIRES this
3. **`autoPlay`** (camelCase in JSX) — translates to HTML `autoplay`
4. **`<source>` tag with `type` attribute** — iOS Safari sometimes refuses to autoplay if MIME type isn't declared
5. **`pointerEvents: 'none'`** — prevents the user from accidentally pausing the video by tapping it (and prevents the play button overlay from being interactive)
6. **`controls={false}`** — explicitly hide native controls (the play button user is seeing)
7. **`disablePictureInPicture`** — prevents iOS PiP icon from appearing
8. **`onLoadedMetadata` with `.play()` fallback** — iOS sometimes needs an explicit JS play() call even when autoplay attribute is set
9. **`key={restaurant.cover_url}`** — forces React to remount the video element if URL changes (prevents stale state)

---

## STEP 4: APPLY SAME FIX TO ANY OTHER COVER RENDERS

Search for additional places where cover might render as image instead of video:

```bash
grep -rn "cover_url" src/pages/PublicMenu.tsx src/components/ --include="*.tsx"
```

Apply the same `isVideoUrl()` switch pattern wherever needed.

Common locations:
- Splash screen background
- Header/hero section after entering menu
- Any modal or full-screen view

---

## STEP 5: VERIFY POSTER FALLBACK

The `poster={restaurant.logo_url || undefined}` shows the logo as a still frame BEFORE the video loads on slow connections. This avoids the black frame flash.

If you want a better poster, use the first frame of the video. For now, the logo is fine.

---

## STEP 6: BUILD AND TEST

```bash
cd /opt/khp/tabbled
npm run build
```

If build passes, commit and push:

```bash
git add -A
git commit -m "fix(public-menu): mobile autoplay for splash cover video — add playsInline, muted, type attribute, JS play fallback"
git push origin main
```

---

## TEST CHECKLIST

After Vercel deploy (1-2 min):

- [ ] Open https://tabbled.com/menu/ramada-encore-bayrampasa on iPhone Safari → video should autoplay silently, no play button visible
- [ ] Open same URL on Android Chrome → same behavior
- [ ] Desktop Chrome → still works
- [ ] Desktop Safari → still works
- [ ] Tap on the video area → nothing happens (pointerEvents: none) — video keeps playing
- [ ] Slow 3G throttle → poster (logo) shows briefly, then video starts
- [ ] Image cover_url (any other restaurant with .jpg cover) → still renders as image, no regression

---

## WHY THIS WORKS

iOS Safari autoplay policy (2017+):
- Video MUST be muted
- Video MUST have `playsinline` attribute (otherwise iOS interprets as "user wants fullscreen" and blocks it)
- Source MUST have proper MIME type declared
- Sometimes even with all of the above, iOS needs an explicit `.play()` call from JS after metadata loads

Android Chrome autoplay policy:
- Video MUST be muted
- `playsinline` is recommended but not strictly required
- MEI (Media Engagement Index) can override — site needs prior engagement, but `muted` autoplay always works

The `onLoadedMetadata` JS fallback is the safety net: even if the declarative attributes fail, the imperative `.play()` call after metadata load almost always succeeds because at that point the user has already interacted with the page (entering the URL, tapping a QR code link).

---

## ROLLBACK

If anything breaks:

```bash
cd /opt/khp/tabbled
git log --oneline -5
git revert HEAD
git push origin main
```
