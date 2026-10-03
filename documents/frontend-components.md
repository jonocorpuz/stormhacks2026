# Building React components on the model/store

How to write components so they're driven by the backend layers instead of hardcoded data.
Architecture background: [initial-build-plan.md](initial-build-plan.md).

## Mental model

```
components/  ──useApp(selector)──▶  store/   (state)
             ──useActions()──────▶  store/   (mutations; store validates + autosaves)
             ──import─────────────▶ model/   (primitive defs, pure helpers, types)
             ✗ never ─────────────▶ persistence/
```

- **Components render and forward intent. That's it.** No storage, no domain rules, no hardcoded type lists.
- **Model says what things *are*.** Primitive defs (fields, labels, blocks, required) drive forms, cards, pills.
- **Store is the only way to change data.** Every action autosaves. You never call `save`.

## Folder map (`frontend/src/components/`)

| Path | Role |
|---|---|
| `blocks/` | Leaf renderers per **block** (`text`, `longtext`): a `View` and an `Input`. `registry.js` maps block id → `{ View, Input }`. `FieldView` renders one field safely. |
| `forms/PrimitiveForm.jsx` | Generic controlled form for **any** primitive, built from its field defs. |
| `items/` | Cards per **primitive**. `registry.js` maps primitive id → card. `GenericCard` = fallback. `ItemCard` = glass shell (size, issue badge, edit controls). `sizes.js` = bento sizes. |
| `boards/` | Board-level containers: `BoardGate` (no board open), `BoardMenu` (switch/create/rename/delete), `BoardGrid` (items grid). |
| top level | `CreateItemMenu`, `ItemEditor`, `SaveStatus`, glass primitives (`GlassButton`, `GlassInput`). |

Two kinds of components:

- **Containers** (`boards/*`, `CreateItemMenu`, `ItemEditor`, `App`) — may call `useApp` / `useActions`.
- **Presentational** (`blocks/*`, `items/*`, `forms/*`, `Glass*`) — props in, callbacks out. No hooks into the store. Easier to reuse and test.

## Reading state

```jsx
import { useApp } from '../store';

const board = useApp((s) => s.currentBoard);   // Board | null
const boards = useApp((s) => s.boards);        // BoardSummary[] { id, name, updatedAt, itemCount }
const status = useApp((s) => s.status);        // 'idle' | 'loading' | 'saving' | 'error'
```

**Selector rule:** return something that already exists in state. Never build a new object/array inside the selector — it re-renders forever.

```jsx
// ✗ new array every call -> infinite loop
const notes = useApp((s) => s.currentBoard.items.filter(...));

// ✓ select existing ref, derive in render
const board = useApp((s) => s.currentBoard);
const notes = board.items.filter(...);
```

Derivations that encode **meaning** (search, filter, sort, validation) come from model helpers (`itemMatchesQuery`, `getItemIssues`, `validateFields`). If one doesn't exist, add it to `model/` with a test — don't inline it in a component.

## Changing state

```jsx
import { useActions } from '../store';

const { createItem, updateItem, deleteItem, reorderItems, setView,
        createBoard, openBoard, renameBoard, deleteBoard } = useActions();

const { item, issues } = await createItem('note', { title, body });
const issues = await updateItem(item.id, { body: 'new' });
```

- Actions apply instantly to state and autosave. Awaiting is optional (await if you close a modal after).
- **Validation never blocks.** `createItem`/`updateItem` always save and return issues. Show them as flags; don't stop the user.
- Item actions throw if no board is open — that's a bug in the component, not user error.
- **Don't call `updateItem` on every keystroke.** Keep a local draft in `useState`, commit on Save/blur (see `ItemEditor`).

## Where state lives

| Kind | Where | Example |
|---|---|---|
| Domain data | store (via actions) | items, fields, boards, item order |
| Per-board presentation that should persist | `board.view` via `setView(patch)` | card sizes (`view.sizes[itemId]`), layout mode |
| Ephemeral UI | component `useState` | which menu is open, form draft, search text, edit mode |

`board.view` is an opaque bag: the model saves it but never reads it. Pick a key, document it here. Current keys:

- `view.sizes: Record<itemId, '1x1'|'2x1'|'1x2'|'2x2'|'3x1'>` — bento card size.

Never put presentation on items (`item.fields.size` ✗).

## Recipes

### Render a field

Use `FieldView` — it handles empty values (renders nothing) and values with the wrong shape (renders raw JSON instead of hiding data).

```jsx
<FieldView field={fieldDef} value={item.fields[fieldDef.key]} className="text-sm" />
```

### Add a custom card for a primitive

1. Create `items/ListingCard.jsx` taking `{ item, primitive }`. Arrange fields with `FieldView`. No store hooks.
2. Register in `items/registry.js`: `listing: ListingCard`.

Until registered, the primitive renders with `GenericCard` — so this is optional polish, never required.

### Add a new primitive

That's a **model** change, not a component change: add the def to `model/primitives.ts`. Then automatically:

- it appears as a pill in the "+ New" menu,
- `PrimitiveForm` builds its form,
- `GenericCard` renders it.

If the + menu or grid needs editing to support a new primitive, something is hardcoded that shouldn't be.

### Add a new block

1. Model: add to `BlockId` and `BLOCKS` in `model/blocks.ts` (`isValid`, `isEmpty`) + test.
2. UI: create `blocks/NumberBlock.jsx` with `NumberView({ value, className })` and `NumberInput({ value, onChange, placeholder, autoFocus, flagged })`.
3. Register in `blocks/registry.js`.

`Input` contract: controlled, `onChange(nextValue)` with the **block's value type** (e.g. a number, not a string), show a warning ring when `flagged`.

### Add a new view (table, list, moodboard…)

Write a container like `BoardGrid` that reads `currentBoard` and renders items differently. Same items, same model — different presentation. Store the user's choice in `board.view` (e.g. `view.layout`).

## Styling

Reuse existing look — don't invent new surfaces:

- Surfaces: `apple-glass` + `rounded-[2rem]` (cards), `rounded-3xl` (menus/modals), `rounded-full` (buttons/inputs).
- Inputs: `INPUT_CLASS` from `blocks/styles.js`.
- Primary button: `bg-blue-500/90 … rounded-full` (see `CreateItemMenu`).
- Dropdowns: `absolute top-full mt-4 … animate-slide-down-fade z-50`.
- Always pair light + `dark:` variants.
- Bento size classes must be literal strings (Tailwind JIT) — add new sizes in `items/sizes.js`.

## Don'ts

- ✗ `import … from '../persistence'` in components (lint error).
- ✗ `import … from '../model/primitives'` — use `../model` index (lint error).
- ✗ Hardcoded type lists / per-type `if` chains (`if (type === 'note')`) — read `PRIMITIVES` / registries.
- ✗ `localStorage` in components.
- ✗ Coercing or dropping values to make them fit — flag them.
- ✗ Building objects inside `useApp` selectors.

## Checklist before committing

- [ ] Data comes from `useApp` / model defs, not literals
- [ ] Mutations go through `useActions`
- [ ] Presentational components take props only
- [ ] Persisted presentation → `board.view`, documented above
- [ ] `npm run lint && npm run typecheck && npm test` pass
