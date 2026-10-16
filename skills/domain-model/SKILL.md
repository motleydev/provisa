---
name: domain-model
description: The governance entities and the invariants that hold between them. Read before naming a concept, adding an entity, or writing about what the product does.
---

# domain-model

The authority is `docs/domain-principles.md`, with `docs/glossary.md` for terms. What
follows is the shape; read the principles file before changing anything that touches
governance.

## Entities

- **Source** — a connection to an external data system. Infrastructure, owned by the admin,
  not a domain resource.
- **Domain** — the unit of accountability. Every resource is owned by exactly one.
- **Steward** — a domain's owner. A domain may exist in a pending state without one, but it
  cannot serve governed data until it has one.
- **Table** — claimed from a source into a domain. Claiming is exclusive.
- **View** — defined by a steward over domain assets. Always intradomain, always for one of
  two purposes: cross-domain import (a read-only adapter naming external data as a domain
  business concept) or local derivation.
- **Relationship** — an approved traversal between assets. The approved relationship catalog
  is the enforcement mechanism; the compiler rejects a traversal that is not in it.
- **Query** — an interdomain view in any supported language. Creates no new semantics, so it
  needs no additional approval.

## The invariants

1. No ungoverned floating resources — every table, view and relationship belongs to a
   domain.
2. **Tables and views are peers.** The distinction is origin only: a table is claimed, a
   view is defined. Once either exists as a domain asset, governance treats them
   identically — both are in the catalog, both can be a relationship target, both can be
   granted, both pass through the same pipeline.
3. Claiming is exclusive. A table belongs to one domain.
4. A view creates new semantic meaning and needs steward approval. A query does not and
   does not.
5. Access is granted at the resource level, not the query level. If you have access to a
   resource you can query it, and governance is enforced at execution time through the
   pipeline.
6. Governance is expressed entirely in data-layer controls — visibility, RLS, masking,
   relationship enforcement. There is no query registry and no pre-approval concept
   (REQ-001). Do not reintroduce a capability gate on querying.
7. Every view carries a declared business purpose, stated at creation, so a steward
   approves knowing what it is for.
8. Composition depth is not technically enforced; steward judgement at review is the
   control.

## Naming

Use these words for these things. A "dataset" that is really a claimed table, or a
"permission" that is really a capability, costs a reader more than it saves the writer.
`docs/glossary.md` is the list; `docs/arch/groups.yaml` names the fourteen requirement
groups and is the closed enumeration a requirement's `group` must match.

## When the model has to change

A change to any invariant above is a requirement, not an implementation detail: add it to
`docs/arch/requirements.yaml` in group `0. Architecture & Design Principles` or
`1. Access Governance & Security`, and say what it supersedes. See
`skills/audit-workflow/SKILL.md`. Marketing and site copy claim things about this model, so
a change here invalidates claims elsewhere — `site/` carries its own claim checkers.
