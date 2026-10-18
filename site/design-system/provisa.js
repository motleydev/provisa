/* Provisa website design system — behaviour.
 *
 * Everything in the kit that needed React, as progressive enhancement over
 * markup that already renders without it:
 *
 *   theme toggle   persists a light/dark choice over the light default
 *   mobile drawer  menu button, focus trap, escape to close (PRO-3 gap 3)
 *   accordion      one panel open at a time
 *   code tabs      a tablist with arrow-key navigation
 *   switch         a role=switch button
 *   toggle buttons a single-choice group of aria-pressed buttons
 *
 * Load it with `defer` at the end of <head>, after the theme bootstrap. Every
 * handler is delegated from the document, so markup added later still works.
 *
 * The theme bootstrap is NOT here: it has to run before first paint, so it is
 * the one inline <script> in the head. See partials/head.html.
 */
(() => {
  "use strict";

  const KEY = "provisa-theme";
  const root = document.documentElement;

  /* ---- theme ------------------------------------------------------- */

  /* Light is the unconditional default (PRO-2 plan revision 2), so there are
   * only two states and no "auto". Nothing stored means light: the :root
   * color-scheme in tokens.css is `light`, and no prefers-color-scheme rule
   * exists anywhere in the system to fall through to. */
  const DEFAULT = "light";

  // "light" | "dark" — a stored value, or the default when there is none.
  function stored() {
    try {
      const v = localStorage.getItem(KEY);
      return v === "light" || v === "dark" ? v : DEFAULT;
    } catch {
      return DEFAULT; // private mode, or storage disabled
    }
  }

  /* `persist` is false for the sync-up on load: a visitor who has never touched
   * the toggle must not get "light" written to their storage, or a later change
   * to the default would never reach them. Only a click persists. */
  function apply(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try {
        localStorage.setItem(KEY, theme);
      } catch {
        // The toggle still works for this page; it just will not persist.
      }
    }
    for (const group of document.querySelectorAll(".pv-theme")) {
      for (const b of group.querySelectorAll("button[data-theme-set]")) {
        b.setAttribute("aria-pressed", String(b.dataset.themeSet === theme));
      }
    }
  }

  apply(stored(), false);

  /* ---- the drawer -------------------------------------------------- */

  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

  let openDrawer = null;
  let returnFocusTo = null;

  function drawerOpen(drawer, opener) {
    openDrawer = drawer;
    returnFocusTo = opener;
    drawer.classList.add("is-open");
    drawer.removeAttribute("aria-hidden");
    if (opener) opener.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    const first = drawer.querySelector(FOCUSABLE);
    if (first) first.focus();
  }

  function drawerClose() {
    if (!openDrawer) return;
    openDrawer.classList.remove("is-open");
    openDrawer.setAttribute("aria-hidden", "true");
    for (const b of document.querySelectorAll('[data-drawer][aria-expanded="true"]')) {
      b.setAttribute("aria-expanded", "false");
    }
    document.body.style.overflow = "";
    openDrawer = null;
    if (returnFocusTo) returnFocusTo.focus();
    returnFocusTo = null;
  }

  // Keep Tab inside the open drawer. The drawer covers the viewport, so
  // anything behind it is unreachable by pointer and must be by keyboard too.
  function trap(e) {
    if (!openDrawer || e.key !== "Tab") return;
    const items = [...openDrawer.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---- accordion --------------------------------------------------- */

  function accordionToggle(btn) {
    const item = btn.closest(".pv-acc__item");
    const acc = btn.closest(".pv-acc");
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    const wasOpen = btn.getAttribute("aria-expanded") === "true";
    // The kit keeps one panel open at a time.
    for (const other of acc.querySelectorAll('.pv-acc__btn[aria-expanded="true"]')) {
      if (other === btn) continue;
      other.setAttribute("aria-expanded", "false");
      document.getElementById(other.getAttribute("aria-controls")).hidden = true;
    }
    btn.setAttribute("aria-expanded", String(!wasOpen));
    panel.hidden = wasOpen;
    if (!wasOpen && item) item.scrollIntoView({ block: "nearest" });
  }

  /* ---- code tabs --------------------------------------------------- */

  function tabSelect(tab) {
    const list = tab.closest(".pv-codetabs__tabs");
    for (const t of list.querySelectorAll(".pv-codetabs__tab")) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    }
  }

  /* ---- delegation -------------------------------------------------- */

  document.addEventListener("click", (e) => {
    const themeBtn = e.target.closest("button[data-theme-set]");
    if (themeBtn) {
      apply(themeBtn.dataset.themeSet === "dark" ? "dark" : "light", true);
      return;
    }

    const opener = e.target.closest("[data-drawer]");
    if (opener) {
      const drawer = document.getElementById(opener.dataset.drawer);
      if (drawer) {
        if (openDrawer === drawer) drawerClose();
        else drawerOpen(drawer, opener);
      }
      return;
    }

    if (e.target.closest("[data-drawer-close]")) {
      drawerClose();
      return;
    }

    // A nav link inside the drawer closes it on the way out.
    if (openDrawer && e.target.closest("a") && openDrawer.contains(e.target)) {
      drawerClose();
      return;
    }

    const accBtn = e.target.closest(".pv-acc__btn");
    if (accBtn) {
      accordionToggle(accBtn);
      return;
    }

    const tab = e.target.closest(".pv-codetabs__tab");
    if (tab) {
      tabSelect(tab);
      return;
    }

    const sw = e.target.closest(".pv-switch");
    if (sw) {
      const on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      const state = sw.querySelector(".pv-switch__state");
      if (state) state.textContent = on ? "on" : "off";
      return;
    }

    const toggle = e.target.closest(".pv-toggle button");
    if (toggle) {
      for (const b of toggle.closest(".pv-toggle").querySelectorAll("button")) {
        b.setAttribute("aria-pressed", String(b === toggle));
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openDrawer) {
      e.preventDefault();
      drawerClose();
      return;
    }
    trap(e);

    // Left/right along a tablist, as a tablist is expected to behave.
    const tab = e.target.closest?.(".pv-codetabs__tab");
    if (tab && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End")) {
      const tabs = [...tab.closest(".pv-codetabs__tabs").querySelectorAll(".pv-codetabs__tab")];
      const i = tabs.indexOf(tab);
      const next =
        e.key === "Home" ? tabs[0]
        : e.key === "End" ? tabs[tabs.length - 1]
        : e.key === "ArrowLeft" ? tabs[(i - 1 + tabs.length) % tabs.length]
        : tabs[(i + 1) % tabs.length];
      e.preventDefault();
      tabSelect(next);
      next.focus();
    }
  });

  /* A drawer left open across a resize into the desktop header would hide the
   * page behind a display:none element, so close it with the breakpoint.
   *
   * --bp-nav, read off the element rather than written out, so this cannot
   * drift from tokens.css the way the two @media bounds in provisa.css can. */
  const bp = getComputedStyle(root).getPropertyValue("--bp-nav").trim() || "1280px";
  const wide = matchMedia(`(min-width: ${bp})`);
  wide.addEventListener("change", (e) => {
    if (e.matches) drawerClose();
  });
})();
