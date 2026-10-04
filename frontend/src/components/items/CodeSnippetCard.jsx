import React from 'react';
import CodeSnippetWidget from '../CodeSnippetWidget';

export default function CodeSnippetCard({ item, primitive }) {
  const data = {
    title: item.fields.title,
    language: item.fields.language,
    code: item.fields.code,
    date: item.fields.date,
  };

  return <CodeSnippetWidget data={data} />;
}
