import { describe, expect, it } from 'vitest'
import {
  NOTE,
  PRIMITIVES,
  buildExtractionPrompt,
  buildExtractionSchema,
  buildMockExtraction,
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
    const empty: PrimitiveDef = { id: 'empty', name: 'Empty', fields: [] }
    expect(extractablePrimitives([NOTE, empty])).toEqual([NOTE])
    expect(extractablePrimitives().length).toBe(PRIMITIVES.filter((p) => p.fields.length).length)
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

  it('list block: array schema, entries get ids', () => {
    const TODO: PrimitiveDef = {
      id: 'todo',
      name: 'Todo',
      fields: [{ key: 'items', label: 'Items', block: 'list', required: false }],
    }
    const schema = buildExtractionSchema([TODO]) as any
    expect(schema.properties.items.items.properties.fields.properties.items.type).toBe('array')
    const [draft] = parseExtraction(
      { items: [{ primitiveId: 'todo', fields: { items: [{ title: 'Milk', isChecked: false }] } }] },
      [TODO],
    )
    expect(draft.fields.items).toEqual([{ id: expect.any(String), title: 'Milk', isChecked: false }])
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

  it('mock extraction prefers note, else fills the first text field', () => {
    const drafts = buildMockExtraction([PLACE, NOTE])
    expect(drafts).toHaveLength(1)
    expect(drafts[0].primitiveId).toBe('note')
    expect(drafts[0].fields.title).toBeTruthy()
    expect(buildMockExtraction([PLACE])[0]).toEqual({ primitiveId: 'place', fields: { address: 'Offline capture' } })
  })
})
