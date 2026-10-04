import React from 'react';
import TicketWidget from '../TicketWidget';

export default function TicketCard({ item }) {
  const data = {
    vendor: item.fields.vendor,
    title: item.fields.title,
    eventDate: item.fields.eventDate,
    location: item.fields.location,
    entryInfo: item.fields.entryInfo,
    section: item.fields.section,
    row: item.fields.row,
    seat: item.fields.seat,
    url: item.fields.url,
  };

  return <TicketWidget data={data} />;
}
