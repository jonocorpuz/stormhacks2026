import React from 'react';
import ReceiptWidget from '../ReceiptWidget';

export default function ReceiptCard({ item }) {
  const data = {
    title: item.fields.title,
    items: item.fields.items,
    taxes: item.fields.taxes,
    total: item.fields.total,
    date: item.fields.date,
  };

  return <ReceiptWidget data={data} />;
}
