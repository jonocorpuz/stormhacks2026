// Vendors rarely expose per-ticket links, so with no saved URL we open the account's ticket list.
const MY_TICKETS: readonly [RegExp, string][] = [
  [/ticketmaster/i, 'https://www.ticketmaster.ca/user/orders'],
];

// Saved URLs come from AI extraction: add a missing scheme, and only allow http(s).
export function ticketHref(url: string | undefined, vendor: string | undefined): string {
  const raw = url?.trim() ?? '';
  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw;
    if (!/^[a-z][a-z\d+.-]*:/i.test(raw)) return `https://${raw}`;
  }
  return MY_TICKETS.find(([re]) => vendor && re.test(vendor))?.[1] ?? '';
}
