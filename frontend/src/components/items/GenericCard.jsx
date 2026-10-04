import React from 'react';
import FieldView from '../blocks/FieldView';

// Fallback card for any primitive without a custom card: every field, in schema order.
// Text sizes clamp against the card's own width (cqw), not the viewport.
export default function GenericCard({ item, primitive }) {
  return (
    <div className="[container-type:inline-size] flex flex-col h-full min-h-0 gap-3 overflow-hidden">
      <span className="text-[length:clamp(0.625rem,3.5cqw,0.75rem)] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
        {primitive.name}
      </span>
      {primitive.fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-0.5">
          <span className="text-[length:clamp(0.625rem,3.5cqw,0.75rem)] text-black/50 dark:text-white/50">{field.label}</span>
          <FieldView
            field={field}
            value={item.fields[field.key]}
            className="text-[length:clamp(0.75rem,4cqw,0.875rem)] text-black dark:text-white break-words"
          />
        </div>
      ))}
    </div>
  );
}
