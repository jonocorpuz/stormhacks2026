# AI extraction slice

Outcome of design grilling session, 2026-10-03. Replaces the mock widget pipeline from PR #4.

## Goal

Thinnest end-to-end vertical slice: drop image(s) → Gemini → real model items on the board. Proves field mapping works. Demo polish later.

## Decisions

| Topic | Decision |
|---|---|
| Targets | Note only. Primitives with zero fields (`recommendation_list`) auto-excluded. AI picks best match even if poor. |
| Input | Images only (png/jpeg/webp), multiple per drop. 1 capture per file, run in parallel. Others → "not supported" status. >20MB rejected. |
| Items per image | Exactly 1 (prompt), but contract stays array (`ExtractionDraft[]`) so 0..N later = prompt change. |
| Captures | Built + passed through pipeline but **inactive**: not persisted, `captureId: null`. Marked `TODO(capture)`. Needs storage decision (IndexedDB/backend) before activating. |
| Output strictness | Gemini `responseJsonSchema` generated from primitives (primitiveId enum, field keys locked, blocks → string). Values stored as-is, empty omitted, soft validation on read. Unknown primitiveId = hard error. |
| Mocks | None. Works or errors. Missing key → clear error. Tests use inline test doubles only. |
| Model | `gemini-3.6-flash`, hardcoded in `server/extract.js`. (3.8-flash preferred but 503 overloaded at build time.) |
| Server | Vite dev middleware only (`/api/extract`). Keeps key out of bundle. No prod backend this slice — needs serverless fn later. |
| Target board | Always current board. No board open → creates "Untitled" first. |
| Board switching | Blocked while any extraction pending: store guards `createBoard`/`openBoard`/`closeBoard`/`deleteBoard`(current); BoardMenu disables controls. Rename + item edits allowed. |
| Placement | Append to end (`addItem`); CSS `grid-flow-dense` backfills holes. |
| Progress UI | In-memory `state.extractions`; `ExtractionStatus` pills bottom-right. Success clears; failures stay until dismissed. |

## Layers

```
App.jsx drop ─▶ createCapture (model) ─▶ store.ingestCaptures ─▶ Extractor (interface)
                                              │                      └─ HttpExtractor ─▶ /api/extract ─▶ server/extract.js ─▶ Gemini
                                              └─▶ createItem + addItem ─▶ autosave
```

- `model/capture.ts` — `Capture`, `createCapture`, `captureProblem` (type/size).
- `model/extract.ts` — `extractablePrimitives`, `buildExtractionPrompt`, `buildExtractionSchema`, `parseExtraction`. Pure. Server imports it, so client never sends prompts.
- `extractor/` — `Extractor` interface + wire types; `HttpExtractor`. Imports only model. Injected in `main.jsx`.
- `store/` — `ingestCaptures`, `dismissExtraction`, `extractions`, switch guard.

## Deferred

- Capture persistence (+ `captureId` link, source preview).
- More primitives / blocks (product, place, receipt…).
- PDFs, text, URLs.
- 0..N items per capture.
- Per-primitive preferred card size; smart fitting/placement algorithm.
- Production backend for `/api/extract`.
- Placeholder cards while extracting.
