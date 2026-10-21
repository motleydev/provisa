/* Provisa slide walkthrough — behaviour (PRO-150).
 *
 * Progressive enhancement over a page that already renders. The markup is a
 * sequence of <section class="pv-slide"> inside a .pv-deck, which with this
 * file absent is one scrolling editorial article: every heading in order,
 * every figure captioned, printable, and the ?view=page rendering. This file
 * upgrades that into a deck. It never creates it.
 *
 * What it adds:
 *
 *   deck mode      data-mode="deck" on the container, one slide per viewport
 *   stepping       arrows, space, Home/End, click zones, swipe
 *   hash sync      #s-07 is deep-linkable and survives reload
 *   the rail       mono indices with aria-current, and the CTA past halfway
 *   motion         data-state per slide, so walkthrough.css can reveal
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

  /* Each slide needs a stable id to be the target of a hash, of aria-current
   * and of the rail. A deck that numbers its own slides in the markup keeps
   * them; one that does not gets them here, in document order. */
  slides.forEach((slide, i) => {
    if (!slide.id) slide.id = "s-" + String(i + 1).padStart(2, "0");
    slide.dataset.index = String(i + 1);
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `Slide ${i + 1} of ${slides.length}`);
  });

  deck.dataset.mode = "deck";
  deck.dataset.motion = "on";
  deck.tabIndex = -1;

  /* ---- the rail ---------------------------------------------------- */

  /* Indices, not dots. The kit numbers its sections and its figures, and a
   * dot row would be the one unnumbered counter in the system. The CTA below
   * them stays hidden until the visitor is past the halfway slide: asking for
   * the meeting on slide two is the behaviour this deck exists to avoid. */
  const rail = document.createElement("nav");
  rail.className = "pv-rail";
  rail.setAttribute("aria-label", "Slides");

  const list = document.createElement("ol");
  list.className = "pv-rail__list";
  const railLinks = slides.map((slide, i) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "pv-rail__link";
    a.href = "#" + slide.id;
    a.textContent = String(i + 1).padStart(2, "0");
    a.setAttribute("aria-label", `Slide ${i + 1}`);
    li.append(a);
    list.append(li);
    return a;
  });
  rail.append(list);

  const railCta = document.createElement("a");
  railCta.className = "pv-btn pv-btn--sm pv-rail__cta";
  railCta.href = "#contact";
  railCta.textContent = "Book a demo";
  railCta.hidden = true;
  rail.append(railCta);
  deck.after(rail);

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

  /* ---- which slide is current -------------------------------------- */

  /* The observer is the single source of truth for "current", so a scroll, a
   * keypress, a rail click and a back-button all converge on the same code
   * path. 0.6 as the threshold rather than 0.5 keeps a slow scroll from
   * flickering between two neighbours at the midpoint. */
  /* -1, not 0: setCurrent returns early when the index has not changed, so a
   * real starting value would make the first call a no-op and leave the rail
   * and the counter empty until the second slide. */
  let current = -1;
  let autoplay = null;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const slide = entry.target;
        if (entry.isIntersecting) {
          slide.dataset.state = "enter";
          if (entry.intersectionRatio >= 0.6) setCurrent(Number(slide.dataset.index) - 1);
        }
      }
    },
    { root: deck, threshold: [0, 0.6] }
  );
  for (const slide of slides) {
    slide.dataset.state = "idle";
    observer.observe(slide);
  }

  function setCurrent(i) {
    if (i === current) return;
    current = i;
    railLinks.forEach((a, n) => {
      if (n === i) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    railCta.hidden = i + 1 <= slides.length / 2;
    history.replaceState(null, "", "#" + slides[i].id);
  }

  /* ---- stepping ---------------------------------------------------- */

  function go(i, focus) {
    const n = Math.max(0, Math.min(slides.length - 1, i));
    slides[n].scrollIntoView({ block: "start" });
    setCurrent(n);
    /* Focus moves to the slide's own heading so a screen reader and a keyboard
     * reader land where a sighted reader's eye lands. The slide itself is the
     * fallback target for a master that has no heading, M3's statement being
     * the one in the set. */
    if (focus) {
      const h = slides[n].querySelector("h1,h2,h3") || slides[n];
      if (!h.hasAttribute("tabindex")) h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
        e.preventDefault();
        stopAutoplay();
        go(current + 1, true);
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        stopAutoplay();
        go(current - 1, true);
        break;
      case "Home":
        e.preventDefault();
        stopAutoplay();
        go(0, true);
        break;
      case "End":
        e.preventDefault();
        stopAutoplay();
        go(slides.length - 1, true);
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
   * link, a form field or a selection inside a slide is never a step. */
  deck.addEventListener("click", (e) => {
    if (e.target.closest("a,button,input,textarea,select,label")) return;
    if (!window.getSelection().isCollapsed) return;
    const box = deck.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    if (x > 0.66) {
      stopAutoplay();
      go(current + 1, false);
    } else if (x < 0.34) {
      stopAutoplay();
      go(current - 1, false);
    }
  });

  /* Swipe. Vertical, matching the scroll axis, and only past a threshold a
   * scroll would not already have handled. */
  let touchY = null;
  deck.addEventListener("touchstart", (e) => {
    touchY = e.touches[0].clientY;
  }, { passive: true });
  deck.addEventListener("touchend", (e) => {
    if (touchY === null) return;
    const dy = e.changedTouches[0].clientY - touchY;
    touchY = null;
    if (Math.abs(dy) < 60) return;
    stopAutoplay();
    go(current + (dy < 0 ? 1 : -1), false);
  });

  /* ---- hash --------------------------------------------------------- */

  window.addEventListener("hashchange", () => {
    const i = slides.findIndex((s) => "#" + s.id === location.hash);
    if (i >= 0) go(i, true);
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
      go(current + 1, false);
    }, DWELL);
  });

  /* ---- first paint -------------------------------------------------- */

  const fromHash = slides.findIndex((s) => "#" + s.id === location.hash);
  if (fromHash > 0) go(fromHash, false);
  else setCurrent(0);
})();
