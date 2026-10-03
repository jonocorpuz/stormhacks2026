Sacrifice grammar for the sake of concision.

Atomic commits
## Architecture (frontend/src)

Plan: `documents/initial-build-plan.md`. Model is center.

- `model/` — pure TS domain: blocks, primitives, items, boards, validation. No React, no storage, no side effects.
- `persistence/` — `BoardRepository` impls. Only loads/saves model objects. Never validates.
- `store/` — app state + actions + autosave. Only place that calls persistence. `useApp`/`useActions` = only React bridge.
- `components/` — pure rendering. Read via `useApp`, mutate via `useActions`. Never import persistence or layer internals.
- Concrete repo injected in `main.jsx` only.
- New semantic types = data in `model/primitives.ts`, not React logic. Presentation (cards, layout, `board.view`) owned by frontend.
- Validation soft + computed on read; never block saves, never drop/coerce values.
- Boundaries enforced by `npm run lint`. Run `npm test`, `npm run typecheck`, `npm run lint` before committing.
