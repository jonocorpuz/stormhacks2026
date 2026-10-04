import React from 'react';
import MusicWidget from '../MusicWidget';

export default function MusicCard({ item }) {
  const data = {
    title: item.fields.title,
    artist: item.fields.artist,
    url: item.fields.url,
    date: item.fields.date,
  };

  return <MusicWidget data={data} />;
}
