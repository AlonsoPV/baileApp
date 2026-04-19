# Explore Critical Chain Audit

Date: 2026-04-19
Scope: `apps/web` route `/explore`

## Goal

Reduce the initial critical chain for `/explore` so useful content appears sooner, with less dependency on the first JS bundle.

## Baseline

Observed before this pass:

- `/explore` HTML response around `~460 ms`
- main app bundle `assets/index-*.js` around `~883 ms`
- useful content depended too early on large JS parse/eval

Build baseline before changes:

- `dist/assets/index-DPdMqAjT.js`: `275.96 kB` (`86.08 kB gzip`)
- `dist/assets/ExploreHomeScreenModern--1TvN4yF.js`: `162.73 kB` (`36.64 kB gzip`)
- `dist/assets/motion-CgEIW0C8.js`: `126.21 kB` (`41.45 kB gzip`)
- `dist/assets/i18n-zWxoyL3y.js`: `65.39 kB` (`21.93 kB gzip`)

## Audit Findings

### 1. `/explore` is route-split, but its chunk was still too heavy

`AppRouter.tsx` already lazy-loads `ExploreHomeScreenModern`, so the route is split correctly. The main issue was the amount of code statically imported inside the route chunk itself.

Primary contributors:

- `ExploreHomeScreenModern.tsx` imports multiple view variants and interactive panels up front.
- non-default views for fechas (`EventSocialGridCard`, `EventCarteleraCard`) were included even when the default first paint is list mode
- filter dropdowns were imported in the initial route chunk even though they only render after interaction
- `AcademiesSection` and related secondary section logic sat in the same route graph

### 2. Shared app boot still carried non-essential work

Before changes:

- Vercel Analytics and Speed Insights were imported in `main.tsx` at startup
- payment success/cancel and Stripe onboarding public screens were eagerly imported in `AppRouter.tsx`
- `NotFound` was also eager in the main router graph

These are not the main cause of `/explore` cost, but they still added weight to the shared `index` bundle.

### 3. `/explore` did extra work before the user needed it

Before changes:

- `useTags()` ran immediately on every `/explore` visit
- first fechas query requested `48` rows while the UI initially revealed only a smaller visible slice
- this meant extra network, normalization and memo work before first useful paint

### 4. Fonts are not hard-blocking, but still costly

`index.html` uses non-blocking Google Fonts loading (`media="print"` + `onload`, plus `display=swap`), which avoids strict render blocking.

However, the app still requests:

- `Inter`
- `Poppins`
- `Barlow`
- `Montserrat`

with weights `400-900` for all four families.

This likely increases:

- CSS/font request competition with JS
- post-paint font swap/reflow
- total bytes on first visit

Because `Barlow` and `Montserrat` are used in several non-explore public screens, this pass documents the issue but does not remove them yet.

## Changes Applied

### Shared boot / router

1. `apps/web/src/main.tsx`
   - deferred Vercel signals with idle/timed loading
   - avoids paying analytics bundle cost on the critical path

2. `apps/web/src/AppRouter.tsx`
   - lazy-loaded:
     - `NotFound`
     - `StripeOnboardingSuccess`
     - `StripeOnboardingRefresh`
     - `PaymentSuccess`
     - `PaymentCanceled`

### `/explore` route chunk

3. `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx`
   - switched route-local framer usage from `motion` to `m` to align with app-level `LazyMotion`
   - lazy-loaded interaction-only panels:
     - `MultiSelectTreeDropdown`
     - `DateFilterDropdown`
   - lazy-loaded non-default or secondary route pieces:
     - `EventSocialGridCard`
     - `EventCarteleraCard`
     - `AcademiesSection`
   - gated `useTags()` so tags load only when needed:
     - when ritmos/zonas dropdown opens
     - or when the selected section actually needs tag metadata (`clases`, `academias`, `maestros`, `usuarios`, `organizadores`)
   - reduced initial fechas page size from `48` to `18`

### Render priority / progressive loading

The route already had a helpful progressive model:

- `/explore` defaults to `fechas`
- only the active section is rendered (`showAll = false`)
- visible cards are limited client-side (`INITIAL_LIMIT`)

This pass reinforces that model by:

- fetching fewer fechas on the first request
- avoiding the download of dropdowns until interaction
- avoiding non-default card view code until the user actually switches view mode

## Validation After Changes

Build after changes:

- `dist/assets/index-CDKyyxui.js`: `258.39 kB` (`82.34 kB gzip`)
- `dist/assets/ExploreHomeScreenModern-DXuRFlZb.js`: `142.12 kB` (`32.47 kB gzip`)
- new deferred chunks created for route-adjacent pieces:
  - `dist/assets/AcademiesSection-7Jj7mrL3.js`: `6.20 kB`
  - `dist/assets/EventSocialGridCard--W2sdGPf.js`: `6.59 kB`
  - `dist/assets/NotFound-DqsG34ok.js`: `6.78 kB`
  - payment/stripe screens now isolated in small chunks

Net improvement from this pass:

- shared `index` chunk: `275.96 kB -> 258.39 kB` (`-17.57 kB`, about `-6.4%`)
- `/explore` route chunk: `162.73 kB -> 142.12 kB` (`-20.61 kB`, about `-12.7%`)

## Remaining Opportunities

### High value, still pending

1. Split locale resources
   - `apps/web/src/i18n/index.ts` still bundles both `es` and `en`
   - load non-default locale JSON on demand

2. Reduce font payload
   - keep `Inter` as the main shell font
   - audit whether `Poppins` is still needed globally
   - trim Google Fonts weight ranges
   - consider route- or feature-level font loading for `Barlow` / `Montserrat`

3. Keep trimming the explore route graph
   - `ExploreHomeScreenModern.tsx` is still a very large screen file
   - secondary section view variants for classes, teachers, users, organizers and brands can still be split further

4. Review shared heavy chunks
   - `motion-*.js`
   - `i18n-*.js`
   - `supabase-*.js`
   - route-independent logic inside the shared `index` bundle

### Lower risk follow-up measurements

Measure again on mobile web / Android WebView:

- FCP
- LCP
- TBT / main-thread blocking
- route transition time into `/explore`
- user-visible time to first painted list skeleton and first real card

## Summary

This pass focused on quick wins with real impact and low UX risk:

- less shared boot JS
- smaller `/explore` route chunk
- interaction-only code now deferred
- less data fetched on the first fechas request

The route still has room to improve, but the initial critical chain is now smaller and the first useful render depends on less code than before.
