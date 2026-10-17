---
name: i18n-translate
description: Translate the Provisa UI locale catalogs in-session, incrementally, against the per-locale translation memory sidecar. Use when an English string is added, changed or removed, or when a locale catalog is behind English.
---

# i18n-translate

Locale catalogs are translated by the agent inside the session. No external
translation service is called and no translation API key exists (REQ-1341). The
unit of work is "the keys English has that this locale's memory does not already
account for" — never the whole catalog.

## The files

```
provisa-ui/src/i18n/locales/
  en.json              root catalog, 6 top-level sections
  en/<ns>.json         167 per-component catalogs
  <lng>.json           the same root catalog, translated
  <lng>/<ns>.json      the same per-component catalogs, translated
  <lng>/.tm.json       translation memory sidecar, one per target locale
```

English is the only source of truth for keys. The 12 target locales are `es`,
`fr`, `de`, `nl`, `he`, `ja`, `zh`, `zh-HK`, `ru`, `it`, `pt`, `hi`, declared in
`provisa-ui/src/i18n/index.ts` under `supportedLngs` alongside `en`.

`index.ts` glob-imports `./locales/<lng>/*.json` and spreads every file over the
root catalog into one `translation` namespace per locale. A key is therefore
global: the same dotted key in two files collides, and the last file merged
wins. Keep each key prefixed with its component (`adminPage.saveButton` lives in
`adminPage.json`).

## The translation memory

`.tm.json` is a flat JSON object. Each entry records the **English source text
that a translation was made from**, keyed by origin file and dotted key:

```json
{
  "fr.json::common.cancel": "Cancel",
  "fr/adminPage.json::adminPage.saveButton": "Save"
}
```

The value is English, not the translation. That is the point: comparing the
recorded English against today's English is what tells you a key went stale.

Write new entries as `<lng>.json::<key>` for the root catalog and
`<lng>/<ns>.json::<key>` for a per-component catalog.

## Procedure

1. Read the English catalogs and build the full key set, each key tagged with
   the file it came from.
2. For the target locale, read `.tm.json`. A key needs translating when it is
   **absent** from the memory, or when the memory's recorded English **differs**
   from today's English. Everything else is already current — do not retranslate
   it, do not re-emit it, and do not reword it.
3. Translate only that set. Match the register of the surrounding catalog:
   product UI, second person, no marketing voice.
4. Write the translations into the matching `<lng>` catalog file, preserving the
   nesting and key order of the English file.
5. Write the English source for each translated key back into `.tm.json`.
6. Drop memory entries whose key no longer exists in English, in the same pass.
7. Verify the invariants below before finishing.

## Invariants

- **Key parity.** Every locale carries exactly the English key set — no missing
  keys, no extras. Measured 2026-10-17 on `main`: all 12 locales at 6090 keys.
- **Placeholder parity.** Every `{{name}}` in an English string appears in the
  translation, with the same names and no additions. Measured 2026-10-17: zero
  mismatches across all 12 locales.
- **No external call.** Translation happens in-session. If a task seems to need
  a translation API, the task is wrong, not the rule.
- **English is never translated.** `en.json` and `en/<ns>.json` are edited by
  the feature work that introduces the string, not by this skill.

Both parity invariants hold by practice; neither is enforced by code on `main`.
REQ-2015 proposes the vitest case that would enforce them,
`provisa-ui/src/__tests__/i18nCatalogParity.test.ts`. Until it lands, step 7 is
the only check there is.

## Things the current data gets wrong

Audited 2026-10-17 across all 12 sidecars. Follow the rules above rather than
copying the existing shape:

- Three key prefix conventions are in use: `<lng>.json::` (756 entries),
  `<lng>/<ns>.json::` (73145) and a bare `<ns>.json::` (60, all of them
  `aiModelsTab.json` or `registerTableForm.json`). Only the first two are
  correct.
- One key per sidecar is recorded twice under conflicting prefixes with
  different English.
- 75 to 77 entries per sidecar name keys English no longer has. Step 6 above
  exists to stop that growing.
- 7 English keys have no memory entry in any locale, and 3 entries record
  English that has since changed. Both are handled correctly by step 2 — the
  next run picks them up.
