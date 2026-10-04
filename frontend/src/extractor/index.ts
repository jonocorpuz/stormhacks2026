// Public entry for the extractor layer. Store uses the interface; main.jsx picks the impl.

export type { ExtractRequest, ExtractResponse, Extractor } from './extractor'
export { HttpExtractor } from './httpExtractor'
