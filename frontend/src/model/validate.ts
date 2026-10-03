// Validation is soft and computed on read — never stored, never blocks.

import { getBlock } from './blocks'
import type { FieldValues, Item } from './item'
import { getPrimitive, type PrimitiveDef } from './primitives'

export type IssueKind = 'missing_required' | 'invalid_value' | 'orphaned_field'

export interface Issue {
  fieldKey: string
  kind: IssueKind
}

/** Validate raw field values (e.g. an unsaved form draft) against a primitive. */
export function validateFields(fields: FieldValues, def: PrimitiveDef): Issue[] {
  const issues: Issue[] = []

  for (const field of def.fields) {
    const block = getBlock(field.block)
    const value = fields[field.key]
    if (block.isEmpty(value)) {
      if (field.required) issues.push({ fieldKey: field.key, kind: 'missing_required' })
    } else if (!block.isValid(value)) {
      issues.push({ fieldKey: field.key, kind: 'invalid_value' })
    }
  }

  const known = new Set(def.fields.map((f) => f.key))
  for (const key of Object.keys(fields)) {
    if (!known.has(key)) issues.push({ fieldKey: key, kind: 'orphaned_field' })
  }

  return issues
}

export function validateItem(item: Item, def: PrimitiveDef): Issue[] {
  return validateFields(item.fields, def)
}

/** Validate against the item's own primitive. */
export function getItemIssues(item: Item): Issue[] {
  return validateItem(item, getPrimitive(item.primitiveId))
}
