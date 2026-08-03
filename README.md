# FactoryPilot — Base (validation prototype)

A generic order-tracking core for small manufacturing businesses. This build is a
click-through prototype: no backend, no login. Data is kept in the browser's
`localStorage` so it survives a page refresh while you're testing.

> Not for real daily use yet — the data lives in one browser on one machine.
> Once the screens and flow are signed off, the same UI gets wired to a real
> backend.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

## Screens

| Screen | Route | What it does |
| --- | --- | --- |
| Order list | `/` | All orders, with stage tabs, search and filters; columns come from the configured fields |
| New order | `/orders/new` | Full-page form built from the configured fields, with repeatable line items; starts the order in the first stage |
| Order detail | `/orders/<id>` | Order fields, the item table, a stage picker (any stage, forwards or backwards), and the full stage history |
| Order fields | `/fields` | Define what an order looks like for this business — add, edit, reorder, remove fields, and pick the title field |
| Stage settings | `/stages` | Add, rename, reorder, remove stages, and set each stage's colour |
| Reporting | `/reporting` | Count per stage, average time per stage, overdue list with an adjustable threshold |
| Roles | `/roles` | Add/edit/remove roles and toggle each of the six permissions per role |
| Users | `/users` | Add/edit/remove users and assign each a role |

## How it's put together

```
src/
  lib/
    types.ts       data shapes (field definitions, orders, stages, history, roles, users, settings)
    storage.ts     the only file that knows about localStorage
    data.ts        the data layer — every screen reads and writes through useData()
    fields.ts      field helpers (validation, formatting, order titles)
    permissions.ts role/user helpers — hasPermission, roleForUser, userName
    reporting.ts   pure calculations (counts, averages, overdue, formatting)
  components/      shared UI (nav, stage badge, field input, identity picker) + shadcn/ui in components/ui
  app/           the screens
```

Swapping in a real backend later means rewriting `storage.ts` and `data.ts`.
The screens call `useData()` and shouldn't need to change.

## Configurable fields

An order has no fixed business fields. What it holds is defined on the **Order
fields** screen and stored in `field_definitions`; each order keeps its answers
in `field_values`, keyed by field key. Six types are supported: text, long text,
number, select, multi-select and file.

The same build serves different businesses with no code changes — configure a
sole factory with production type / model / colours / sizes, or a cabinet
manufacturer with client and channel per order and model / type code / quantity
per item, and the new order form, list columns and detail view all follow.

- **Each field has a scope.** *Per order* fields are filled in once; *per item*
  fields repeat for every line item, so one order can carry several models,
  sizes or quantities. An order stores its own answers in `field_values` and one
  entry per line in `items`.
- **One field is the title field.** It gives an order its display name in lists
  and headings; setting a new one unsets the previous. If the title value is
  blank, the order number is used instead. Only a per-order field can be the
  title.
- **Renaming a key moves stored values with it**, so existing orders keep their
  answers.
- **Removing a field leaves old answers in place.** They show on the order
  detail marked "field no longer configured" rather than disappearing quietly.
- **File fields keep the actual file**, as a data URL, for anything under 3 MB —
  small enough to fit comfortably in localStorage. Larger files keep only their
  name and size; they show as "kaydedilmedi" rather than a broken link. Every
  stored file can be reopened or downloaded from the order or item it's on.
- **`created_by` / `changed_by` are not free text.** They store the acting
  user's id — see Roles & users below — and are shown via that user's name.

## Notes on behaviour

- **Stage history is automatic.** An entry is written when an order is created
  (`from_stage` is empty) and on every stage change. It is never edited by hand.
- **Stage order is display order only.** An order can move to any stage at any
  time, including back to an earlier one.
- **Renaming a stage** updates existing orders and their history, so nothing is
  orphaned.
- **A stage that still holds orders can't be removed** — move those orders first.
- **Average time per stage** only counts stages an order has already left. A
  stage an order is still sitting in shows `—` until it moves on.

## Roles & users

There's no real login. A small **identity picker** sets which user is "acting"
for the session (persisted in localStorage, shown again if that user gets
removed); everyone can see and pick anyone from the list at any time — this is
differentiation for normal use, not access control, and the picker says so.

- **Six fixed permission types**: `manage_roles`, `manage_stages`,
  `manage_fields`, `create_order`, `move_stage`, `view_reporting`. Which roles
  have which is fully configurable on the **Roles** screen; the six types
  themselves are not.
- **A role either has a permission or it doesn't, globally** — not per stage or
  per field. "Only the Installer role can move orders to Installed" is a later,
  more granular feature, not this one.
- **One role per user.**
- **The seeded Admin role can't be deleted or lose `manage_roles`.** Without
  that guarantee a misconfiguration could lock everyone out of role management
  for good.
- **Gated screens and actions hide, they don't grey out**, for anyone whose
  role lacks the permission: the nav link, the "Yeni sipariş" button, the
  stage-change card, kanban dragging. Reaching a gated route directly (typed
  URL) shows a plain "no access" message rather than the screen's contents.
- **`created_by` / `changed_by` on orders and stage history now store a user
  id**, resolved to a name for display. Older records made before this feature
  existed stored a typed name instead — those are shown as-is, since there's no
  user to resolve them to.

## Deliberately not built

Backend/database, real authentication (passwords, sessions), per-stage or
per-field permissions, multiple roles per user, client portal, stock and
parts, installation scheduling, payments or invoicing.
