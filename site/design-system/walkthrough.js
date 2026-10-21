/* Provisa slide walkthrough — behaviour (PRO-150).
 *
 * Progressive enhancement over a page that already renders. The markup is a
 * sequence of <section class="pv-slide"> inside a .pv-deck, which with this
 * file absent is one scrolling editorial article: every heading in order,
 * every figure captioned, printable, and the ?view=page rendering. This file
 * upgrades that into a deck. It never creates it.
 *
 * The deck is a tab set, not a scroller. Every slide occupies the same stage
 * and exactly one is shown; moving between them wipes the arriving slide over
 * the leaving one and replays that slide's own reveal. Nothing about a deck
 * scrolls — a briefing is a sequence of statements, and a scrollbar invites a
 * reader to skim past the argument rather than take it a step at a time. The
 * article at ?view=page is the rendering that scrolls, and it is one link away
 * from every slide.
 *
 * What it adds:
 *
 *   deck mode      data-mode="deck" on the container, one slide on the stage
 *   the tabs       a tablist of slide indices, aria-selected, click to jump
 *   stepping       arrows, space, Home/End, click zones, swipe
 *   hash sync      #s-07 is deep-linkable and survives reload
 *   motion         data-show for the wipe, data-state for the slide's reveal
 *   autoplay       off by default, behind the kit's switch, any input cancels
 *
 * Load it with `defer`, after provisa.js. It reads two query parameters:
 * ?view=page forces the article rendering, and ?deck=<id> is read by the page
 * itself rather than here, because which deck to serve is a routing question.
 */
(() => {
  "use strict";

  const deck = document.querySelector(".pv-deck[data-walkthrough]");
  if (!deck) return;

  const slides = Array.from(deck.querySelectorAll(".pv-slide"));
  if (slides.length < 2) return;

  const params = new URLSearchParams(location.search);

  /* The escape hatch is honoured before anything else is built, so ?view=page
   * is the article with no controller attached at all rather than a deck with
   * its controls hidden. */
  if (params.get("view") === "page") {
    deck.dataset.mode = "page";
    return;
  }

  /* Each slide needs a stable id to be the target of a hash, of a tab's
   * aria-controls and of the hash in the address bar. A deck that numbers its
   * own slides in the markup keeps them; one that does not gets them here, in
   * document order. */
  slides.forEach((slide, i) => {
    if (!slide.id) slide.id = "s-" + String(i + 1).padStart(2, "0");
    slide.dataset.index = String(i + 1);
    slide.setAttribute("aria-roledescription", "slide");
  });

  deck.dataset.mode = "deck";
  deck.dataset.motion = "on";
  deck.dataset.dir = "fwd";
  deck.tabIndex = -1;

  /* walkthrough.css reads this to stop the root scrolling; see pinDocument
   * below for why the document has to stay where it is put. */
  document.documentElement.dataset.deckMode = "on";

  /* The slide's own title, which is what a tab is for. Decks put the title in
   * one of three master-scale headings; M3's statement is the display, M1's
   * cover likewise. The index is the fallback for a master with no heading at
   * all, and it is a label rather than a missing value. */
  function titleOf(slide, i) {
    const h = slide.querySelector(".pv-sl__display, .pv-sl__h2, .pv-sl__h3");
    const text = h ? h.textContent.trim().replace(/\s+/g, " ") : "";
    return text || `Slide ${i + 1}`;
  }

  /* ---- the tabs ---------------------------------------------------- */

  /* Indices, not dots, and not titles either: twenty titles do not fit across
   * a slide and the kit numbers its sections and its figures, so a number is
   * the label this system already uses for "which one of these". The title of
   * the selected slide is printed at the end of the strip, and every tab
   * carries its own title as its accessible name, so nothing is lost to a
   * screen reader or to a hover.
   *
   * The strip is the deck's own first child rather than a sibling above it,
   * and that is load-bearing twice over: the accent custom properties are
   * declared on the deck and inherit, so the selected tab is the briefing's
   * own colour without the see/get/run mapping being written a second time;
   * and the deck is then one grid of two rows, so the stage is exactly the
   * room left under the strip at every size, with nothing measured. */
  const tabsBar = document.createElement("div");
  tabsBar.className = "pv-tabs";

  const list = document.createElement("div");
  list.className = "pv-tabs__list";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Slides");

  const tabs = slides.map((slide, i) => {
    const title = titleOf(slide, i);
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "pv-tabs__tab";
    tab.id = "t-" + slide.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", slide.id);
    tab.setAttribute("aria-selected", "false");
    tab.setAttribute("aria-label", `Slide ${i + 1} of ${slides.length}: ${title}`);
    tab.title = title;
    tab.tabIndex = -1;
    tab.textContent = String(i + 1).padStart(2, "0");
    list.append(tab);

    /* A slide is the panel of its tab, named by it. aria-roledescription is
     * already on the section, so a screen reader says "slide" and not "tab
     * panel" while the relationship stays the one assistive technology knows
     * how to walk. */
    slide.setAttribute("role", "tabpanel");
    slide.setAttribute("aria-labelledby", tab.id);
    return tab;
  });
  tabsBar.append(list);

  /* The title of the slide on the stage. aria-hidden because the selected tab
   * already carries it as its name, and hearing it twice on every step is
   * noise. */
  const now = document.createElement("p");
  now.className = "pv-tabs__now";
  now.setAttribute("aria-hidden", "true");
  tabsBar.append(now);

  /* The deck's own ask, and it is not allowed to appear on slide two: it
   * arrives once the reader is past halfway, and goes again on the close
   * slide, where the form it would jump to is already on screen.
   *
   * It jumps to the close slide rather than to the page's contact band: deck
   * mode holds the document at its top, so a fragment anywhere below the
   * stage is somewhere a reader in deck mode cannot be taken. The close slide
   * carries the same form, and the controller picks the jump up as a step. */
  const cta = document.createElement("a");
  cta.className = "pv-btn pv-btn--sm pv-tabs__cta";
  cta.href = "#" + slides[slides.length - 1].id;
  cta.textContent = "Book a demo";
  cta.hidden = true;
  tabsBar.append(cta);

  deck.prepend(tabsBar);

  /* ---- the control bar --------------------------------------------- */

  const bar = document.createElement("div");
  bar.className = "pv-deck__bar";

  const counter = document.createElement("span");
  counter.className = "pv-deck__count";
  bar.append(counter);

  const pageLink = document.createElement("a");
  pageLink.className = "pv-link pv-link--inline";
  pageLink.href = withParam("view", "page");
  pageLink.textContent = "Read as one page";
  bar.append(pageLink);

  /* role=switch, which provisa.js already drives for the kit's Switch. Off is
   * the only acceptable initial state: a deck that starts moving on load takes
   * the pace away from the reader. */
  const play = document.createElement("button");
  play.type = "button";
  play.className = "pv-switch";
  play.setAttribute("role", "switch");
  play.setAttribute("aria-checked", "false");
  play.innerHTML =
    '<span>Advance automatically</span>' +
    '<span class="pv-switch__state">off</span>' +
    '<span class="pv-switch__track" aria-hidden="true"></span>';
  const playState = play.querySelector(".pv-switch__state");
  bar.append(play);
  deck.after(bar);

  function withParam(key, value) {
    const u = new URL(location.href);
    u.searchParams.set(key, value);
    return u.pathname + u.search;
  }

  /* ---- the stage's height ------------------------------------------ */

  /* How much of the viewport the chrome above the deck takes: the utility bar
   * and the sticky header. walkthrough.css subtracts it from the deck's
   * height, because a deck sized at a full viewport under that chrome puts the
   * slide's own footer below the fold. Measured rather than declared: the
   * utility bar has no height token and the header's height changes when its
   * nav wraps, so neither is a number the stylesheet can know. The strip is
   * not in this number — it is inside the deck, and the grid gives the stage
   * whatever the strip leaves. */
  function fitDeck() {
    pinDocument();
    const top = deck.getBoundingClientRect().top + window.scrollY;
    deck.style.setProperty("--deck-offset", Math.max(0, Math.round(top)) + "px");
  }

  /* The offset above is measured against a document at its top, and it stays
   * true only there: the utility bar is part of what it counts and the bar
   * rolls away as soon as the document moves, leaving the stage that much
   * short of the viewport and a band of the contact section showing under
   * every slide. Deck mode owns the viewport, so the document is held at the
   * top. The root's overflow in walkthrough.css stops a reader scrolling it;
   * this stops the things that scroll it without a reader — a load that
   * arrives with a hash, focus moving into a slide, a fragment link. */
  function pinDocument() {
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }

  fitDeck();
  window.addEventListener("resize", fitDeck);

  /* The chrome above the deck does not keep the height it had when the
   * controller first measured it: the three webfonts land after first paint
   * and the header's nav wraps at narrow widths. Either one moves the deck's
   * top edge, and a stale offset is a deck taller than the room it has —
   * which puts the slide's own footer under the fold, intermittently, on
   * whichever load the fonts were slowest. Both are re-measured here.
   *
   * Both elements are chrome every deck page carries and
   * check-page-walkthrough.mjs asserts each of them by name, so a missing one
   * throws here rather than being quietly skipped — and the browser half
   * fails on the console error. */
  const chrome = new ResizeObserver(fitDeck);
  for (const el of [document.querySelector(".pv-utility"),
                    document.querySelector(".pv-header")]) chrome.observe(el);
  document.fonts.ready.then(fitDeck);
  /* The root cannot be scrolled by a reader while deck mode is on, so this
   * only ever catches a scroll the page gave itself, and never fights one. */
  window.addEventListener("scroll", pinDocument, { passive: true });

  /* ---- which slide is on the stage --------------------------------- */

  /* -1, not 0: show() returns early when the index has not changed, so a real
   * starting value would make the first call a no-op and leave the stage
   * empty. */
  let current = -1;
  let autoplay = null;
  let leaving = null;
  let arriving = null;
  let onArrival = null;

  /* A slide that has left the stage goes back to its pre-enter state, so that
   * arriving at it again replays its reveal rather than showing a slide that
   * has already finished. It cannot be reset while it is still painted under
   * the arriving slide — that would animate its rules closed in view — so the
   * reset waits for the wipe to land, which the arriving slide announces. An
   * animationend is the end of the wipe itself rather than a guess at how long
   * the wipe takes, so reduced motion needs no special case: the kit collapses
   * the duration and the event arrives in the same frame. */
  function parkSlide(slide) {
    slide.removeAttribute("data-show");
    slide.dataset.state = "idle";
    if (leaving === slide) leaving = null;
  }

  function forgetArrival() {
    if (arriving) arriving.removeEventListener("animationend", onArrival);
    arriving = null;
    onArrival = null;
  }

  for (const slide of slides) slide.dataset.state = "idle";

  function show(i, focus) {
    const n = Math.max(0, Math.min(slides.length - 1, i));
    if (n === current) return;

    /* A step that lands during a wipe finishes the previous one first, so a
     * reader holding the arrow key never leaves a slide painted on the stage
     * behind the one on it. */
    forgetArrival();
    if (leaving && leaving !== slides[n]) parkSlide(leaving);

    const from = current >= 0 ? slides[current] : null;
    const slide = slides[n];
    deck.dataset.dir = from && n < current ? "back" : "fwd";
    current = n;

    if (from && from !== slide) {
      from.dataset.show = "out";
      leaving = from;
    }

    /* The wipe is the slide's own animation, so an animationend from anything
     * inside it is somebody else's event. */
    arriving = slide;
    onArrival = (e) => {
      if (e.target !== slide) return;
      forgetArrival();
      if (leaving && leaving !== slide) parkSlide(leaving);
    };
    slide.addEventListener("animationend", onArrival);

    /* The reveal has to start from the pre-enter state in the frame the slide
     * becomes visible, or the transitions have nothing to animate from. Two
     * frames, because one is not enough to guarantee the browser has taken
     * the idle state as a start value. Both of them happen behind a wipe that
     * begins fully clipped, so nothing of the pre-enter state is ever seen. */
    slide.dataset.show = "on";
    slide.dataset.state = "idle";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (slides[current] === slide) slide.dataset.state = "enter";
    }));

    tabs.forEach((tab, t) => {
      const on = t === n;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    revealTab(n);
    now.textContent = titleOf(slide, n);
    counter.textContent = `${String(n + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    cta.hidden = n + 1 <= slides.length / 2 || n === slides.length - 1;
    history.replaceState(null, "", "#" + slide.id);

    /* Where focus goes depends on what moved the deck. A click or a keypress
     * on the tablist keeps focus on the tab, which is how a tab set behaves
     * and what makes the arrow keys keep working. Stepping with the keyboard
     * anywhere else moves focus to the slide's own heading, so a screen reader
     * and a keyboard reader land where a sighted reader's eye lands. The slide
     * itself is the fallback target for a master with no heading, M3's
     * statement being the one in the set. */
    if (focus === "tab") tabs[n].focus();
    else if (focus === "slide") {
      const h = slide.querySelector("h1,h2,h3") || slide;
      if (!h.hasAttribute("tabindex")) h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
    pinDocument();
  }

  /* The strip is one line and a deck can be twenty slides long, so the strip
   * scrolls itself rather than wrapping into a second row that would change
   * the stage's height mid-deck. Arithmetic rather than scrollIntoView, which
   * takes every ancestor with it and would move the document. */
  function revealTab(n) {
    const tab = tabs[n];
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    const pad = 24;
    if (left - pad < list.scrollLeft) list.scrollLeft = Math.max(0, left - pad);
    else if (right + pad > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = right + pad - list.clientWidth;
    }
  }

  /* ---- stepping ---------------------------------------------------- */

  list.addEventListener("click", (e) => {
    const tab = e.target.closest(".pv-tabs__tab");
    if (!tab) return;
    stopAutoplay();
    show(tabs.indexOf(tab), "tab");
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    /* Automatic activation: the arrow keys select as they move, which is the
     * behaviour a tablist of slides wants — the panel *is* the content. */
    const focus = e.target.closest(".pv-tabs__list") ? "tab" : "slide";

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
        e.preventDefault();
        stopAutoplay();
        show(current + 1, focus);
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        stopAutoplay();
        show(current - 1, focus);
        break;
      case "Home":
        e.preventDefault();
        stopAutoplay();
        show(0, focus);
        break;
      case "End":
        e.preventDefault();
        stopAutoplay();
        show(slides.length - 1, focus);
        break;
      case "Escape":
        stopAutoplay();
        location.href = withParam("view", "page") + "#" + slides[current].id;
        break;
      default:
        break;
    }
  });

  /* Click zones, on the outer thirds. The middle third is left alone so a
   * link, a form field or a selection inside a slide is never a step, and the
   * strip is excluded whole — it is inside the deck, and the gap beside a tab
   * is not a click zone. */
  deck.addEventListener("click", (e) => {
    if (e.target.closest(".pv-tabs")) return;
    if (e.target.closest("a,button,input,textarea,select,label")) return;
    if (!window.getSelection().isCollapsed) return;
    const box = deck.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    if (x > 0.66) {
      stopAutoplay();
      show(current + 1, "none");
    } else if (x < 0.34) {
      stopAutoplay();
      show(current - 1, "none");
    }
  });

  /* Swipe, on whichever axis the finger actually travelled. The deck moves
   * sideways now, so a horizontal swipe is the one that matches what a reader
   * sees; a vertical one is kept because a page with no scrollbar still gets
   * flicked up by a thumb expecting one, and that should step rather than do
   * nothing. */
  let touch = null;
  deck.addEventListener("touchstart", (e) => {
    /* The strip scrolls itself sideways under a finger; a swipe there is that
     * scroll and not a step. */
    touch = e.target.closest(".pv-tabs")
      ? null
      : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  deck.addEventListener("touchend", (e) => {
    if (touch === null) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    const d = Math.abs(dx) >= Math.abs(dy) ? -dx : -dy;
    if (Math.abs(d) < 60) return;
    stopAutoplay();
    show(current + (d > 0 ? 1 : -1), "none");
  });

  /* ---- hash --------------------------------------------------------- */

  window.addEventListener("hashchange", () => {
    const i = slides.findIndex((s) => "#" + s.id === location.hash);
    if (i >= 0) show(i, "slide");
  });

  /* ---- autoplay ----------------------------------------------------- */

  const DWELL = 8000;

  function stopAutoplay() {
    if (autoplay === null) return;
    clearInterval(autoplay);
    autoplay = null;
    play.setAttribute("aria-checked", "false");
    playState.textContent = "off";
  }

  /* stopPropagation, deliberately: provisa.js carries a delegated handler that
   * flips aria-checked and the state text on any .pv-switch it sees. This
   * switch owns a timer as well as a state, so the two must not both write it
   * — without this, the generic handler would undo whichever value this one
   * just set. The class stays because the styling is the kit's. */
  play.addEventListener("click", (e) => {
    e.stopPropagation();
    if (autoplay !== null) {
      stopAutoplay();
      return;
    }
    play.setAttribute("aria-checked", "true");
    playState.textContent = "on";
    autoplay = setInterval(() => {
      if (current >= slides.length - 1) {
        stopAutoplay();
        return;
      }
      show(current + 1, "none");
    }, DWELL);
  });

  /* ---- first paint -------------------------------------------------- */

  const fromHash = slides.findIndex((s) => "#" + s.id === location.hash);
  show(fromHash > 0 ? fromHash : 0, "none");
})();
