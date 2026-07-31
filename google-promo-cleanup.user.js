// ==UserScript==
// @name         Google Promo Cleanup
// @namespace    https://github.com/bbossola/google-promo-cleanup
// @version      1.0.0
// @description  Hides the "Upgrade" / "Get Google AI Pro" buttons and promo panels Google injects into Gmail, Gemini, Docs, Drive and friends.
// @author       Bruno Bossola
// @match        https://*.google.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------- config --

  const DEBUG = false;

  // Hosts where an upgrade link is the point of the page. Never touch these.
  const EXCLUDED_HOSTS = [
    'accounts.google.com',
    'one.google.com',
    'payments.google.com',
    'play.google.com',
  ];

  // An element is promo if its accessible name matches one of these.
  // Anchored on purpose: "Upgrade" is a CTA, "Upgrade your browser" is not.
  const PROMO_PATTERNS = [
    /^upgrade$/i,
    /^upgrade to\b/i,
    /^(get|try|explore)\s+google\s+ai\s+(pro|ultra)\b/i,
    /^google\s+ai\s+(pro|ultra)\b/i,
    /^(get|try)\s+gemini\s+advanced\b/i,
    /^get\s+more\s+storage$/i,
    /^esegui\s+l['’]upgrade\b/i,
    /^passa\s+a\s+(google\s+)?(ai\s+(pro|ultra)|one)\b/i,
    /^prova\s+google\s+ai\s+(pro|ultra)\b/i,
  ];

  // Accessible names longer than this are containers, not buttons.
  const MAX_NAME_LENGTH = 60;

  // How far to climb from a matched button looking for its promo card.
  const MAX_LIFT = 5;

  // A candidate panel holding more text than this is page furniture, not a card.
  const MAX_PANEL_TEXT = 400;

  const HIDDEN_ATTR = 'data-gpc-hidden';

  // ------------------------------------------------------------------ css ---

  // Layer 1: static rules, applied before first paint so the promo never
  // flashes. These cover the markup Google ships today; the observer below is
  // what survives Google rewriting it.
  const CSS = `
    a[href*="one.google.com"][href*="upgrade"],
    a[href*="one.google.com"][href*="/plans"],
    a[href*="gemini.google.com/advanced"],
    [aria-label="Upgrade" i],
    [aria-label^="Upgrade to" i],
    [${HIDDEN_ATTR}] {
      display: none !important;
    }
  `;

  function injectStyle() {
    const style = document.createElement('style');
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // ------------------------------------------------------------ matching ---

  const LANDMARKS = new Set(['BODY', 'HTML', 'MAIN', 'NAV', 'HEADER', 'FOOTER', 'FORM']);
  const LANDMARK_ROLES = new Set(['main', 'navigation', 'banner', 'contentinfo', 'toolbar']);
  const CLICKABLE = 'a, button, [role="button"], [role="link"], [role="menuitem"], input, select, textarea';

  function accessibleName(el) {
    const label = el.getAttribute('aria-label') || el.textContent || '';
    return label.replace(/\s+/g, ' ').trim();
  }

  // Pure: given an element, is it a promo call-to-action?
  function isPromo(el) {
    const name = accessibleName(el);
    if (!name || name.length > MAX_NAME_LENGTH) return false;
    return PROMO_PATTERNS.some((re) => re.test(name));
  }

  function isLandmark(el) {
    if (LANDMARKS.has(el.tagName)) return true;
    const role = el.getAttribute('role');
    return role ? LANDMARK_ROLES.has(role.toLowerCase()) : false;
  }

  // Climb from a matched CTA to the promo card wrapping it, so we don't leave
  // an empty bordered box behind. We stop as soon as an ancestor holds anything
  // else the user might click — that ancestor is a toolbar, not a promo card.
  function liftToPanel(el) {
    let best = el;
    let node = el.parentElement;

    for (let i = 0; i < MAX_LIFT && node; i++, node = node.parentElement) {
      if (isLandmark(node)) break;
      if (node.textContent.replace(/\s+/g, ' ').trim().length > MAX_PANEL_TEXT) break;

      const clickables = node.querySelectorAll(CLICKABLE);
      const foreign = Array.from(clickables).some((c) => c !== el && !el.contains(c));
      if (foreign) break;

      best = node;
    }

    return best;
  }

  // -------------------------------------------------------------- hiding ---

  const seen = new WeakSet();

  function hide(el) {
    const target = liftToPanel(el);
    if (seen.has(target)) return;
    seen.add(target);

    target.setAttribute(HIDDEN_ATTR, '');
    target.style.setProperty('display', 'none', 'important');

    if (DEBUG) console.log('[google-promo-cleanup] hid', describe(target), target);
  }

  function describe(el) {
    const parts = [];
    for (let n = el; n && n.tagName && parts.length < 4; n = n.parentElement) {
      const id = n.id ? `#${n.id}` : '';
      const cls = typeof n.className === 'string' && n.className
        ? `.${n.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';
      parts.unshift(`${n.tagName.toLowerCase()}${id}${cls}`);
    }
    return parts.join(' > ');
  }

  function scan(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;

    if (root.matches && root.matches(CLICKABLE) && isPromo(root)) hide(root);

    const candidates = root.querySelectorAll ? root.querySelectorAll(CLICKABLE) : [];
    for (const el of candidates) {
      if (isPromo(el)) hide(el);
    }
  }

  // ------------------------------------------------------------ observer ---

  let pending = [];
  let scheduled = false;

  function flush() {
    scheduled = false;
    const batch = pending;
    pending = [];
    for (const node of batch) scan(node);
  }

  function schedule(node) {
    pending.push(node);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  }

  function start() {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes') {
          schedule(m.target);
          continue;
        }
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) schedule(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });

    // Full sweeps: the observer only sees mutations after it starts, and these
    // apps repaint large chunks on SPA navigation.
    const sweep = () => scan(document.body);
    document.addEventListener('DOMContentLoaded', sweep);
    window.addEventListener('load', sweep);
    window.addEventListener('popstate', sweep);
    window.addEventListener('hashchange', sweep);
    setTimeout(sweep, 1000);
    setTimeout(sweep, 3000);
  }

  // ---------------------------------------------------------------- main ---

  if (EXCLUDED_HOSTS.includes(location.hostname)) {
    if (DEBUG) console.log('[google-promo-cleanup] skipping', location.hostname);
    return;
  }

  injectStyle();
  start();

  if (DEBUG) console.log('[google-promo-cleanup] active on', location.hostname);
})();
