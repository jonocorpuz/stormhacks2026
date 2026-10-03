import React from 'react';
import FieldView from '../blocks/FieldView';

// Fallback card for any primitive without a custom card: every field, in schema order.
export default function GenericCard({ item, primitive }) {
  return (
    <div className="flex flex-col h-full min-h-0 gap-3 overflow-hidden">
      <span className="text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
        {primitive.name}
      </span>
      {primitive.fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-0.5">
          <span className="text-xs text-black/50 dark:text-white/50">{field.label}</span>
          <FieldView
            field={field}
            value={item.fields[field.key]}
            className="text-sm text-black dark:text-white"
          />
        </div>
      ))}
    </div>
  );
}
