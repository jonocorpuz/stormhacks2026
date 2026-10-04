export interface ListItem {
  id: string;
  title: string;
  isChecked: boolean;
}

export interface ListWidgetData {
  title: string;
  date: string;
  items: ListItem[];
}

export interface CodeSnippetData {
  title: string;
  /** Display label and highlighter language, e.g. "java", "tsx". */
  language: string;
  code: string;
  date: string;
}

export interface MapWidgetData {
  /** Place name, e.g. "Nintendo Store". */
  title: string;
  address: string;
  date: string;
}

export interface NoteWidgetData {
  title: string;
  body: string;
  date: string;
}

export interface ProductWidgetData {
  title: string;
  description: string;
  price: string;
  brand: string;
  model: string;
  /** Product listing page. */
  url: string;
  imageUrl: string;
  date: string;
}

export interface ReceiptWidgetData {
  title: string;
  /** One line item per line, name then price, e.g. "Hamburger $5.00". */
  items: string;
  /** One tax per line, e.g. "GST $1.50". */
  taxes: string;
  total: string;
  date: string;
}

export interface TicketWidgetData {
  /** Ticket seller, e.g. "Ticketmaster". */
  vendor: string;
  /** Event name. */
  title: string;
  eventDate: string;
  location: string;
  entryInfo: string;
  section: string;
  row: string;
  seat: string;
  /** Link to the ticket. */
  url: string;
}
