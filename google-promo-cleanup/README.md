# Google Promo Cleanup

A Tampermonkey userscript that hides the "Upgrade" / "Get Google AI Pro" buttons and
promo panels Google injects into Gmail, Gemini, Docs, Drive, Calendar and the rest.

## Install

`google-promo-cleanup.user.js` — see [installing a script](../README.md#installing-a-script)
in the root README.

Runs on `https://*.google.com/*` at `document-start`, with `@grant none`.

`https://meet.google.com/*` is excluded in the header with `@exclude`, so Tampermonkey
never injects the script into a Meet call. This also covers Meet frames embedded in Gmail
and Calendar, because those frames load from `meet.google.com`.

## How it works

Two layers, because Google rewrites this markup often:

- **CSS injected at `document-start`** for the promo hooks that exist today. The
  panel never paints, so there's no flash before it disappears.
- **A `MutationObserver`** that watches for clickable elements whose accessible name
  (text or `aria-label`) matches a promo pattern — `Upgrade`, `Get Google AI Pro`,
  `Passa a Google AI Pro`, etc. This is the layer that keeps working when Google
  changes class names.

Matched elements are hidden with `display: none !important`, never removed from the
DOM — Gmail and Gemini re-render aggressively and yanking nodes out can trigger
re-insert loops.

When a promo button is found, the script climbs up to 5 ancestors looking for the
card wrapping it, so no empty bordered box is left behind. It stops climbing as soon
as an ancestor contains anything else clickable — that's a toolbar, not a promo card.

`accounts.google.com`, `one.google.com`, `payments.google.com` and `play.google.com`
are excluded: that's where you'd legitimately manage a subscription.

Some targets only make sense on one host — Gmail's **Studio** button is hidden there,
but "Studio" is a real product name on `aistudio.google.com`, so that pattern is scoped
via `HOST_PATTERNS` rather than applied globally.

## When Google changes something

Set `DEBUG = true` at the top of the script. Every hidden element is logged with a
short selector path, which makes it easy to spot what the new markup looks like and
add a pattern to `PROMO_PATTERNS` or a selector to `CSS`.

## Config

All at the top of the file:

| Constant | Purpose |
| --- | --- |
| `DEBUG` | Log every hidden element to the console |
| `EXCLUDED_HOSTS` | Hosts the script leaves alone entirely |
| `PROMO_PATTERNS` | Anchored regexes matched against accessible names, everywhere |
| `HOST_PATTERNS` | Extra regexes that apply on one host only |
| `HOST_CSS` | Extra static CSS for one host only |
| `MAX_NAME_LENGTH` | Names longer than this are containers, not buttons |
| `MAX_LIFT` | How far to climb looking for the promo card |
| `MAX_PANEL_TEXT` | A candidate card holding more text than this is page furniture |
