import React from 'react';
import ProductWidget from '../ProductWidget';

export default function ProductCard({ item }) {
  const data = {
    title: item.fields.title,
    description: item.fields.description,
    price: item.fields.price,
    brand: item.fields.brand,
    model: item.fields.model,
    url: item.fields.url,
    date: item.fields.date,
  };

  return <ProductWidget data={data} />;
}
