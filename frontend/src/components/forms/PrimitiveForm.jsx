import React from 'react';
import { BLOCK_RENDERERS } from '../blocks/registry';
import { RawView } from '../blocks/RawValue';

const ISSUE_TEXT = {
  missing_required: 'Required',
  invalid_value: "Doesn't match this field's type",
};

// Generic form for any primitive, built from its field defs. Controlled:
// parent owns `values` and gets the next values object from onChange.
// Issues are shown as flags only — they never block submit.
export default function PrimitiveForm({ primitive, values, onChange, issues = [] }) {
  const issueFor = (key) => issues.find((i) => i.fieldKey === key);

  return (
    <div className="flex flex-col space-y-3">
      {primitive.fields.map((field, idx) => {
        const renderer = BLOCK_RENDERERS[field.block];
        const issue = issueFor(field.key);
        return (
          <label key={`${primitive.id}-${field.key}`} className="flex flex-col space-y-1.5">
            <span className="px-1 text-xs font-medium text-ink/75 dark:text-ink/60">
              {field.label}
              {field.required && <span className="text-warning"> *</span>}
              {issue && ISSUE_TEXT[issue.kind] && (
                <span className="ml-2 text-warning">{ISSUE_TEXT[issue.kind]}</span>
              )}
            </span>
            {renderer ? (
              <renderer.Input
                value={values[field.key]}
                onChange={(v) => onChange({ ...values, [field.key]: v })}
                placeholder={field.description ?? field.label}
                autoFocus={idx === 0}
                flagged={Boolean(issue)}
              />
            ) : (
              <RawView value={values[field.key]} />
            )}
          </label>
        );
      })}
    </div>
  );
}
