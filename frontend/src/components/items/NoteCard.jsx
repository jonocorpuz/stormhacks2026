import React from 'react';
import FieldView from '../blocks/FieldView';

// Custom card for the Note primitive: big title, body underneath.
export default function NoteCard({ item, primitive }) {
  const [titleField, bodyField] = ['title', 'body'].map((k) =>
    primitive.fields.find((f) => f.key === k),
  );

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <FieldView
        field={titleField}
        value={item.fields.title}
        className="text-lg font-semibold text-black dark:text-white"
      />
      <FieldView
        field={bodyField}
        value={item.fields.body}
        className="text-sm text-black/70 dark:text-white/70 overflow-hidden"
      />
    </div>
  );
}
