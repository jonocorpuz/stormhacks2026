Sacrifice grammar for the sake of concision.

## Architecture (frontend/src)

Initial Plan (May change): `documents/initial-build-plan.md`. Model is center.

References: (Don't create unecessary context - you don't need to read the linked files below unless it's relevant)
- `model/` — pure TS domain: blocks, primitives, items, boards, validation. No React, no storage, no side effects.
- `persistence/` — `BoardRepository` impls. Only loads/saves model objects. Never validates.
- `store/` — app state + actions + autosave. Only place that calls persistence. `useApp`/`useActions` = only React bridge.
- `extractor/` — `Extractor` interface (capture → item drafts) + `HttpExtractor` (→ `/api/extract` dev proxy → Gemini). Imports only model. Store calls it; concrete impl injected in `main.jsx`. Plan: `documents/ai-extraction-plan.md`.
- `components/` — pure rendering. Read via `useApp`, mutate via `useActions`. Never import persistence or layer internals. Guide: `documents/frontend-components.md`.
- Concrete repo + extractor injected in `main.jsx` only.
- New semantic types = data in `model/primitives.ts`, not React logic. Presentation (cards, layout, `board.view`) owned by frontend.
- Validation soft + computed on read; never block saves, never drop/coerce values.
- Boundaries enforced by `npm run lint`. Run `npm test`, `npm run typecheck`, `npm run lint` before committing.
