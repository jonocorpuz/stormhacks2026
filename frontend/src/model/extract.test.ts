import { describe, expect, it } from 'vitest'
import {
  NOTE,
  PRIMITIVES,
  buildExtractionPrompt,
  buildExtractionSchema,
  captureProblem,
  createCapture,
  extractablePrimitives,
  parseExtraction,
  type PrimitiveDef,
} from '.'

const PLACE: PrimitiveDef = {
  id: 'place',
  name: 'Place',
  fields: [{ key: 'address', label: 'Address', block: 'text', required: true }],
}

describe('extract', () => {
  it('only targets primitives with fields', () => {
    expect(extractablePrimitives(PRIMITIVES).map((p) => p.id)).toEqual(['note'])
  })

  it('prompt lists primitive ids, field keys and descriptions', () => {
    const prompt = buildExtractionPrompt([NOTE])
    expect(prompt).toContain('"note"')
    expect(prompt).toContain('title (Title, text): Short headline')
    expect(prompt).toContain('body (Body, longtext)')
  })

  it('schema locks primitiveId + field keys; one primitive needs no anyOf', () => {
    const schema = buildExtractionSchema([NOTE]) as any
    const item = schema.properties.items.items
    expect(item.properties.primitiveId.enum).toEqual(['note'])
    expect(Object.keys(item.properties.fields.properties)).toEqual(['title', 'body'])
    expect(item.properties.fields.additionalProperties).toBe(false)
  })

  it('schema uses anyOf for several primitives', () => {
    const schema = buildExtractionSchema([NOTE, PLACE]) as any
    expect(schema.properties.items.items.anyOf).toHaveLength(2)
  })

  it('parses drafts, omits empty values, keeps others as-is', () => {
    const raw = { items: [{ primitiveId: 'note', fields: { title: 'Hi', body: '  ', extra: 3 } }] }
    expect(parseExtraction(raw, [NOTE])).toEqual([{ primitiveId: 'note', fields: { title: 'Hi', extra: 3 } }])
  })

  it('throws on unknown primitive or malformed output', () => {
    expect(() => parseExtraction({ items: [{ primitiveId: 'place', fields: {} }] }, [NOTE])).toThrow(/unknown primitive/)
    expect(() => parseExtraction({ nope: 1 }, [NOTE])).toThrow(/expected/)
    expect(() => parseExtraction({ items: ['x'] }, [NOTE])).toThrow(/malformed/)
  })

  it('flags unsupported or oversized captures', () => {
    expect(captureProblem(createCapture('image', 'image/png', 'abc'))).toBeNull()
    expect(captureProblem(createCapture('image', 'application/pdf', 'abc'))).toMatch(/Not supported/)
    expect(captureProblem(createCapture('image', 'image/png', 'a'.repeat(28 * 1024 * 1024)))).toMatch(/Too large/)
  })
})
