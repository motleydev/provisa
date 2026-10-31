---
name: react-graphql
description: How the React admin SPA talks to GraphQL. Four of these rules are enforced by provisa-ui/eslint.config.js, which cites this file by name.
---

# react-graphql

`provisa-ui/eslint.config.js` points at this skill from two of its rule messages. The rules
below are the convention; eslint is the enforcement.

## GraphQL goes through the hooks

```ts
// yes
const { data, loading } = useQuery(GET_SOURCES)
// no
const { data } = await client.query({ query: GET_SOURCES })
```

`useQuery` / `useLazyQuery` / `useMutation`, from `src/hooks/useAdminQueries.ts`. The
imperative `client.query` / `client.mutate` is banned by `no-restricted-syntax`, and the
config says why:

> The imperative API is for non-React contexts (Node, SSR, router loaders); this is a pure
> React SPA, so it is never needed and bypasses the reactive cache.

That cache is the point. A component that fetches imperatively will not re-render when
another component's mutation updates the same entity, so the UI shows stale data with no
error anywhere.

## Only `App.tsx` may import the raw client

`no-restricted-imports` blocks importing `client` from `**/apolloClient`, with `src/App.tsx`
exempted because it wires `<ApolloProvider client={client}>`. That is provider setup, not a
query. Anywhere else, the import is the escape hatch that hides imperative GraphQL.

## A file past 1000 lines is a design signal

`'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }]`.
Subdivide into pure helpers, sub-components and hooks. Six files predate the rule and sit on
a grandfather list in the config — `SqlPage.tsx`, `SqlModelingModal.tsx`, `SourcesPage.tsx`,
`TablesPage.tsx`, `api/admin.ts`, `CommandsPage.tsx`. Each entry is a debt marker: subdivide
the file, delete its line. When the list is empty the rule holds everywhere. Do not add to
it.

## `_` prefix for an intentionally unused binding

`@typescript-eslint/no-unused-vars` is configured with `argsIgnorePattern`,
`varsIgnorePattern` and `caughtErrorsIgnorePattern` all `^_`, plus
`ignoreRestSiblings: true` for omit-via-rest. Name it `_unused`, do not disable the rule.

## Every `eslint-disable` carries a reason

`@eslint-community/eslint-comments/require-description` is an error. `eslint-enable` is
exempt, because the justification lives on the matching disable.
`disable-enable-pair` allows a file-top `/* eslint-disable rule -- reason */` for a
whole-file intentional pattern, such as a context Provider-and-hook module.

## Schema versions reset the store

`src/apolloClient.ts` resets the entire Apollo store when the `X-Schema-Version` response
header changes. Registering a table changes the schema version, so anything cached is gone.
This is also why the e2e harness gives each worker its own backend — see
`skills/puppeteer-debugging/SKILL.md`.

## Before claiming the UI compiles

```bash
cd provisa-ui && npx tsc -b 2>&1 | head -50   # zero errors required
provisa-ui/scripts/precommit-eslint.sh        # what pre-commit runs on src/**/*.ts(x)
```
