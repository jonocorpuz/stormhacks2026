Sacrifice grammar for the sake of concision.

## Server (`server/`)

Express, prod only (Render single web service, `render.yaml`): serves `frontend/dist` + `POST /api/extract`. Runs via `tsx` to import TS model. `server/extract.js` = Gemini proxy shared w/ Vite dev middleware → keep it dependency-free. Local prod run: `npm --prefix frontend run build && GEMINI_API_KEY=… npm --prefix server start`.

**Gemini quota is scarce — save it for real use.**
- Agents/Claude: never call Gemini (no curl to `/api/extract` or Gemini, no app drops w/ key loaded) unless user explicitly asks for that specific call. Verify via tests, typecheck, request validation, missing-key error path.
- Tests never hit network: inject inline fake `Extractor`. No live-API tests, no CI calling it.
- If a live check is approved: one request, no retry loops.

## Architecture (frontend/src)

Initial Plan (May change): `documents/initial-build-plan.md`. Model is center.

References: (Don't create unecessary context - you don't need to read the linked files below unless it's relevant)
- `model/` — pure TS domain: blocks, primitives, items, boards, validation. No React, no storage, no side effects.
- `persistence/` — `BoardRepository` impls. Only loads/saves model objects. Never validates.
- `store/` — app state + actions + autosave. Only place that calls persistence. `useApp`/`useActions` = only React bridge.
- `extractor/` — `Extractor` interface (capture → item drafts) + `HttpExtractor` (→ `/api/extract` → `server/extract.js` → Gemini). Imports only model. Store calls it; concrete impl injected in `main.jsx`. Plan: `documents/ai-extraction-plan.md`.
- `components/` — pure rendering. Read via `useApp`, mutate via `useActions`. Never import persistence or layer internals. Guide: `documents/frontend-components.md`.
- Concrete repo + extractor injected in `main.jsx` only.
- AI extraction derives from model. New block → add its JSON Schema (storage shape) to `BLOCK_JSON_SCHEMA` in `model/extract.ts` (typecheck enforces). New primitive/field → write a clear `description`; it's what the AI maps by. Primitives w/ no fields aren't extractable.
- New semantic types = data in `model/primitives.ts`, not React logic. Presentation (cards, layout, `board.view`) owned by frontend.
- Styling: token colors only — never hex/`rgba()`/Tailwind palette (`gray-400`, `blue-500`) in components. `white`/`black` only when theme-independent (text on colored button, scrims). Tokens = CSS vars in `index.css` (light + `.dark`) → names in `tailwind.config.js`; new color → add token there. Widgets: `components/widgetKit.ts` for spacing/radius/type/shadows. `tokens.test.ts` enforces hex/rgba ban.
- Validation soft + computed on read; never block saves, never drop/coerce values.
- Boundaries enforced by `npm run lint`. Run `npm test`, `npm run typecheck`, `npm run lint` before committing.
