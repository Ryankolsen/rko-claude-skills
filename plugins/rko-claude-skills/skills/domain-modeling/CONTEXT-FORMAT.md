# CONTEXT.md and Glossary.md Format

The project's language lives in two files with two jobs:

- **`CONTEXT.md`** is the orientation. Readers open it whole, so it stays small: **40 lines at most**.
- **`docs/Glossary.md`** is the reference. It may grow without limit, and nobody reads it whole. Readers search it for the one term they need.

Each term lives in exactly one of the two files, never both, so definitions cannot drift apart.

## CONTEXT.md

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Parts

- **Ordering** receives and tracks customer orders; hands placed orders to Fulfillment.
- **Billing** invoices customers once Fulfillment ships.

## Core terms

**Order**:
A customer's request for goods, from placement to delivery.
_Avoid_: Purchase, transaction

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account

Every other term: [docs/Glossary.md](docs/Glossary.md).
```

- **Parts** is optional: the few pieces of the domain and how they relate, one line each. It describes relationships and never defines a term; a term it mentions is defined once, under Core terms or in the glossary. Drop it when the context has only one part.
- **Core terms** are the ones a newcomer needs before anything else makes sense. About six fit under the cap beside the description and Parts.
- When the file passes 40 lines, move the least central core terms to the glossary. Don't let the cap bend.

## docs/Glossary.md

```md
# {Context Name} Glossary

## Billing

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Credit note**:
A negative invoice that cancels some or all of an earlier one.
_Avoid_: Refund, reversal
```

- **One entry per paragraph, the term at the start of the line in bold.** That shape is what makes lookup cheap: `grep -i -A2 '^\*\*invoice' CONTEXT.md docs/Glossary.md` returns the one entry and nothing else.
- Group entries under subheadings when clusters emerge; keep them alphabetical within a group.

## Rules for both files

- **A term earns an entry only if it passes the `_Avoid_` test.** Either there is a wrong word a person or an agent would plausibly reach for instead (it goes under `_Avoid_`), or the term means something narrower here than in everyday use. If plain English would do, leave it out.
- **Prune unused terms.** Whenever you edit either file, search the repository for each entry's term outside these two files; delete the entries nothing uses any more.
- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`.
- **Never list an `_Avoid_` word the project already uses correctly for something else.** Readers treat `_Avoid_` words as banned, so listing "issue" under a finding makes every tracker issue look like a mistake. Search the repository for each word before listing it. An entry earned by a narrower meaning, with no wrong word to avoid, has no `_Avoid_` line.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only include terms specific to this project's context.** General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.

## Single vs multi-context repos

**Single context (most repos):** One `CONTEXT.md` at the repo root and one `docs/Glossary.md`.

**Multiple contexts:** A `CONTEXT-MAP.md` at the repo root lists the contexts, where they live, and how they relate to each other. Each context keeps its own `CONTEXT.md` and `docs/Glossary.md` beside its code:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md): receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md): generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md): manages warehouse picking and shipping

## Relationships

- **Ordering → Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment → Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering ↔ Billing**: Shared types for `CustomerId` and `Money`
```

The skill infers which structure applies:

- If `CONTEXT-MAP.md` exists, read it to find contexts
- If only a root `CONTEXT.md` exists, single context
- If neither exists, create a root `CONTEXT.md` lazily when the first term is resolved, and `docs/Glossary.md` lazily when the first term doesn't belong among the core terms

When multiple contexts exist, infer which one the current topic relates to. If unclear, ask.
