# Google Promo Cleanup

A Tampermonkey userscript that hides the "Upgrade" / "Get Google AI Pro" buttons and
promo panels Google injects into Gmail, Gemini, Docs, Drive, Calendar and the rest.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open `google-promo-cleanup.user.js`, copy it into a new Tampermonkey script, save.

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
| `PROMO_PATTERNS` | Anchored regexes matched against accessible names |
| `MAX_NAME_LENGTH` | Names longer than this are containers, not buttons |
| `MAX_LIFT` | How far to climb looking for the promo card |
| `MAX_PANEL_TEXT` | A candidate card holding more text than this is page furniture |
