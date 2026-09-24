/**
 * Behaviors for the interactive components, attached once to the document by
 * event delegation, so they work for markup rendered on the server or later
 * by React alike:
 *
 * - Tabs, CodeTabs and RoleSwitcher (`[data-pv-tabs]` with ARIA tabs):
 *   click to select; Left/Right/Home/End move between tabs.
 * - Menu (`details[data-pv-menu]`): closes on Escape, on a click outside it,
 *   and after following one of its links.
 *
 * Accordions are native `<details name>` and need nothing here.
 */
export function initBehaviors(doc: Document = document): void {
  const root = doc.documentElement;
  if (root.hasAttribute('data-pv-behaviors')) return;
  root.setAttribute('data-pv-behaviors', '');

  doc.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target) return;

    const tab = target.closest<HTMLElement>('[data-pv-tabs] [role="tab"]');
    if (tab) {
      selectTab(tab);
      return;
    }

    for (const menu of Array.from(doc.querySelectorAll<HTMLDetailsElement>('details[data-pv-menu][open]'))) {
      const link = target.closest('a');
      if (!menu.contains(target) || (link && menu.contains(link))) menu.open = false;
    }
  });

  doc.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    if (event.key === 'Escape') {
      for (const menu of Array.from(doc.querySelectorAll<HTMLDetailsElement>('details[data-pv-menu][open]'))) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
      return;
    }
    if (!target || target.getAttribute('role') !== 'tab' || !target.closest('[data-pv-tabs]')) return;
    const tabs = tabsOf(target);
    const i = tabs.indexOf(target);
    const next =
      event.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length]
      : event.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length]
      : event.key === 'Home' ? tabs[0]
      : event.key === 'End' ? tabs[tabs.length - 1]
      : null;
    if (!next) return;
    event.preventDefault();
    selectTab(next);
    next.focus();
  });
}

function tabsOf(tab: HTMLElement): HTMLElement[] {
  const list = tab.closest('[role="tablist"]');
  return list ? Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')) : [tab];
}

function selectTab(tab: HTMLElement): void {
  for (const t of tabsOf(tab)) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panelId = t.getAttribute('aria-controls');
    const panel = panelId ? tab.ownerDocument.getElementById(panelId) : null;
    if (panel) panel.hidden = !on;
  }
}
