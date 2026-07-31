# Userscripts

Tampermonkey userscripts that clean up things the web does to itself.

| Script | What it does |
| --- | --- |
| [google-promo-cleanup](google-promo-cleanup/) | Hides the "Upgrade" / "Get Google AI Pro" buttons and promo panels Google injects into Gmail, Gemini, Docs, Drive and friends |

## Layout

One folder per script. Each holds the `.user.js` and a README covering what it targets,
how it works and what's configurable.

```
<script-name>/
  <script-name>.user.js
  README.md
```

## Installing a script

Three ways, easiest first.

**Paste it.** Tampermonkey dashboard → the **`+`** tab → select all, delete the
template, paste the file, **Ctrl+S**. Nothing else to configure — the `@match` lines in
the header do the rest.

**Serve it over localhost.** Tampermonkey treats any URL ending in `.user.js` as an
install link and gives you a proper install page:

```
python3 -m http.server 8765 --directory .
```

then open `http://localhost:8765/<script-name>/<script-name>.user.js` and click
**Install**.

**Open the file directly.** `file:///path/to/<script-name>/<script-name>.user.js` also
works, but Chrome blocks extensions from `file://` URLs until you enable *Allow access
to file URLs* for Tampermonkey on `chrome://extensions`.

Note that installing makes Tampermonkey's own copy of the script. Edits in the
Tampermonkey editor don't flow back here — paste working changes into the repo so the
committed version stays authoritative.

## Debugging a script

Every script has a `DEBUG` constant at the top. Set it to `true` and reload the target
page: the script logs what it matched and hid, with a short selector path for each. That
log is the fastest way to find the new markup after a site rewrites its DOM.

If nothing logs at all, the script isn't running on that page — check the `@match` lines
before touching any patterns. Tampermonkey's toolbar badge shows the number of scripts
running on the current tab, which is the quickest confirmation.

## Conventions

- **No `GM_*` grants** unless a script genuinely needs one. `@grant none` keeps them
  portable to Violentmonkey and Greasemonkey, and runs them in page context so
  `console.log` lands in the normal devtools console.
- **Hide, never remove.** Framework-rendered apps re-render aggressively; removing nodes
  can trigger re-insert loops. `display: none !important` is inert.
- **Anchored patterns.** Match on whole accessible names, not substrings — `Upgrade` is
  a call to action, `Upgrade your browser` is a warning.
- **Config at the top of the file**, in named constants, documented in the script's
  README.
