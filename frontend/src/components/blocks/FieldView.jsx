import React from 'react';
import { getBlock } from '../../model';
import { BLOCK_RENDERERS } from './registry';
import { RawView } from './RawValue';

// Render one field's value with its block's View. Empty -> nothing. Wrong shape -> raw.
export default function FieldView({ field, value, className }) {
  const block = getBlock(field.block);
  if (block.isEmpty(value)) return null;

  const renderer = BLOCK_RENDERERS[field.block];
  if (!renderer || !block.isValid(value)) return <RawView value={value} className={className} />;

  const { View } = renderer;
  return <View value={value} className={className} />;
}
