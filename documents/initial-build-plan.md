# Initial build plan

Outcome of design grilling session, 2026-10-03.

## Product idea

Persistent capture workspace for stuff people currently misuse tabs, screenshots, photos, notes, bookmarks to hold. Users drop things in; AI maps them into **known** primitives (never invents structure). Same structured objects later support compare/filter/group/sort/alt views. Original source always preserved so extraction never loses info.

## Scope of this slice

Hackathon demo. This slice builds:

- `model/` — types, primitive defs, pure domain functions, validation
- `persistence/` — repository interface + localStorage + in-memory impls
- `store/` — app store w/ actions + autosave, `useApp` React hook
- guardrails — lint boundaries, tests, per-layer `index.ts`, layer rules in `CLAUDE.md`

**Not** in this slice: React components (teammate owns), captures, AI, schema customization.

## Vocabulary

| Term | Meaning |
|---|---|
| **Block** | Unsemantic value kind. Defines storage shape + validation. Now: `text`, `longtext`. Later: number, image, checklist… |
| **Primitive** | Semantic type built only from blocks (flat, no nesting). Now: **Note**. Later: listing, recipe, product… |
| **Item** | Instance of a primitive. Always lives on exactly one board. |
| **Board** | Owns its items (later captures). Mixed primitive types. No default board — user always on a board or creating one. |
| **Capture** | (later) Raw immutable input. 0..N items per capture, 0..1 capture per item. |

Blocks are unsemantic; the **keys** they're used under are semantic. Primitive says "this `image` acts as `profilePic`".

## Model (`src/model/`, TS, pure, no React)

```ts
FieldDef     { key, label, block, required, description? }
PrimitiveDef { id, name, fields: FieldDef[] }
Item         { id, primitiveId, fields: Record<key, value>, captureId: string | null, createdAt, updatedAt }
Board        { id, name, items: Item[], view: Record<string, unknown>, createdAt, updatedAt, schemaVersion: 1 }
```

FieldDef props, one job each:

- `key` — identity; what item stores value under
- `label` — human name of the meaning (forms, column headers)
- `block` — storage shape + validation
- `required` — rule; flagged when missing
- `description` — semantics for AI mapping (unused for now)

Decisions:

- Primitive defs = static data in model. Global. Not user-editable yet. Field keys stable so customization can come later w/o touching item data.
- Item field values stored bare, keyed by field key. Block type comes from primitive def.
- Pure immutable fns: `createItem`, `updateItemFields`, `addItem`, `removeItem`, `reorderItems`, `createBoard`, `renameBoard`, `setView`.
- Items array order = manual order.
- IDs `crypto.randomUUID()`, timestamps epoch ms.

### Validation

- `validateItem(item, def) → Issue[]` — **computed on read, never stored** (stays correct if schema changes).
- **Soft** (item saved, flagged): missing required, wrong value shape for block, orphaned key not in schema. Values never coerced or dropped.
- **Hard** (throw): programmer bugs only — unknown `primitiveId`, unknown item id.

## Persistence (`src/persistence/`)

```ts
interface BoardRepository {
  listBoards(): Promise<BoardSummary[]>   // { id, name, updatedAt, itemCount }
  loadBoard(id): Promise<Board | null>
  saveBoard(board): Promise<void>         // upsert
  deleteBoard(id): Promise<void>
}
```

- Async even for localStorage so swapping backend doesn't change signatures.
- `LocalStorageRepo`: `board:<id>` → full JSON, `boards:index` → summaries.
- `MemoryRepo` for tests + proof of swappability.
- Whole board saved per change. No partial updates. Persistence never validates.

## Store (`src/store/`)

- One app store: `{ boards: BoardSummary[], currentBoard: Board | null, status }`.
- Actions: `init`, `createBoard`, `openBoard`, `renameBoard`, `deleteBoard`, `createItem`, `updateItem`, `deleteItem`, `reorderItems`, `setView`.
- Autosaves whole board after each action, no debounce (forms should call `updateItem` on save/blur).
- Repo injected at startup in `main.jsx` → swapping persistence = one line.
- `useApp(selector)` via `useSyncExternalStore` — only React-aware file outside components.
- Deleting board deletes its items.

```
components/ (teammate) ──useApp()──▶ store/ ──▶ model/
                                       └──────▶ persistence/ (interface; impl injected)
```

## Presentation (frontend-owned)

- Model holds **no** display hints.
- Frontend builds block renderers, per-primitive cards composed from them (e.g. `NoteCard`), and a `GenericCard` fallback that stacks fields in schema order.
- `Board.view` = opaque bag model persists but never interprets. Frontend picks keys (layout, card sizes…).
- Later, real sort/filter/group become pure model helpers over items, not view state.

## Guardrails

1. oxlint import boundaries: model imports nothing app-level; persistence imports only model; store no components/concrete repos; components no persistence.
2. Vitest tests for model + store (w/ `MemoryRepo`).
3. One public `index.ts` per layer.
4. Layer rules in `CLAUDE.md`.

## Later slices

1. Captures + dumb extractor (`extract(capture, primitives) → [{ primitiveId, fields }]`).
2. Second primitive (e.g. listing) + AI extractor replacing dumb one.
3. More blocks (number, image, checklist, keyvalue).
4. Schema customization (add/remove fields; removal never destroys data).
5. Domain sort/filter/group/compare helpers.
