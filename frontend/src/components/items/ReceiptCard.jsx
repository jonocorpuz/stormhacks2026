import React from 'react';
import ReceiptWidget from '../ReceiptWidget';

export default function ReceiptCard({ item }) {
  const data = {
    title: item.fields.title,
    items: item.fields.items,
    taxRate: item.fields.taxRate,
    date: item.fields.date,
  };

  return <ReceiptWidget data={data} />;
}
