import type { RoleState } from './forms';

/**
 * Behaviors for the interactive components, attached once to the document
 * by event delegation:
 *
 * - CodeTabs (`[data-pv-tabs]`, ARIA tabs): click to select; Left/Right/
 *   Home/End move between tabs.
 * - Menu (`details[data-pv-menu]`): closes on Escape, on a click outside it,
 *   and after following one of its links.
 * - RoleDemo (`[data-pv-roledemo]`): the role buttons swap in that role's
 *   guard state and rows.
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

    const toggle = target.closest<HTMLButtonElement>('[data-pv-roledemo] [data-pv-toggle]');
    if (toggle) {
      selectRole(toggle);
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

function selectRole(button: HTMLButtonElement): void {
  const demo = button.closest<HTMLElement>('[data-pv-roledemo]');
  if (!demo) return;
  const roles = JSON.parse(demo.dataset.pvRoledemo ?? '[]') as RoleState[];
  const state = roles.find((r) => r.role === button.dataset.pvToggle);
  if (!state) return;

  for (const b of Array.from(demo.querySelectorAll<HTMLButtonElement>('[data-pv-toggle]'))) {
    b.setAttribute('aria-pressed', String(b === button));
  }
  const sw = demo.querySelector<HTMLElement>('[data-pv-switch]');
  if (sw) {
    sw.dataset.on = String(state.guard);
    const label = sw.querySelector('[data-pv-switch-state]');
    if (label) label.textContent = state.guard ? 'on' : 'off';
  }
  const rows = Array.from(demo.querySelectorAll<HTMLElement>('.pv-roledemo__val'));
  state.rows.forEach((r, i) => {
    const el = rows[i];
    if (!el) return;
    el.textContent = r.value;
    if (r.warn) el.dataset.warn = 'true';
    else delete el.dataset.warn;
  });
}
