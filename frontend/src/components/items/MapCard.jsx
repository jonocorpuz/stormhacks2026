import React from 'react';
import MapWidget from '../MapWidget';

export default function MapCard({ item }) {
  const data = {
    title: item.fields.title,
    address: item.fields.address,
    date: item.fields.date,
  };

  return <MapWidget data={data} />;
}
