# CLAUDE.md

A collection of Tampermonkey userscripts. No build step, no dependencies, no package
manager — each script is a single self-contained `.user.js` file that gets pasted into
the Tampermonkey dashboard.

## Layout

One folder per script, named after the script:

```
<script-name>/
  <script-name>.user.js    the whole thing
  README.md                what it targets, how it works, what's configurable
```

The root `README.md` holds the script index, install instructions and shared
conventions. When adding a script, add a row to that table.

## Writing a script

Structure every script the same way, top to bottom: metadata block, config constants,
CSS layer, matching helpers, the acting code, then `main` at the bottom.

- **`@grant none`.** Only reach for a `GM_*` API when nothing else works — grants break
  portability to Violentmonkey/Greasemonkey and move the script out of page context,
  where `console.log` no longer lands in the normal devtools console.
- **`@run-at document-start`** for anything that hides page elements, paired with a CSS
  layer injected immediately so the target never paints. `document.head` may not exist
  yet — fall back to `document.documentElement`.
- **Two layers for hostile markup.** Static CSS for the selectors that exist today, plus
  a `MutationObserver` matching on semantics (accessible names, roles) rather than class
  names. The CSS is for the flash, the observer is what survives a redesign.
- **Hide with `display: none !important`, never `.remove()`.** These apps re-render;
  removing nodes can trigger re-insert loops.
- **Anchored regexes over substrings.** `/^upgrade$/i`, not `/upgrade/i`. False
  positives — hiding something the user wanted — are worse than a missed target.
- **Scope narrow rules to their host.** A word that's promotional on one Google property
  is a product name on another. See `HOST_PATTERNS` in google-promo-cleanup.
- **`const DEBUG = false;` at the top of every script**, logging each element acted on
  with a short selector path. This is the only debugging tool available once a script is
  running inside someone's browser.
- Config goes in named constants at the top, and each one gets a row in the script's
  README config table.

## Verifying

There's no test framework here and no DOM to run against, so:

1. `node --check <script>.user.js` — catches syntax errors before a paste.
2. For pattern changes, extract the regex list in a throwaway node script and assert
   against a list of names that should match and a list that should not. The negative
   list is the important one. Do this in the scratchpad, not in the repo.
3. Anything involving the live DOM — observer behaviour, panel lifting, whether a
   selector exists at all — can't be verified from here. Say so rather than implying it
   was tested, and tell the user what to check with `DEBUG = true`.

## Commits

Explain what changed and why the approach was chosen, not just what was touched. Prose,
not bullet lists. Reference the site behaviour that motivated the change — these scripts
exist to react to sites changing, and that context is the useful part six months later.
