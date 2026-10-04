// Primitive id -> custom card. Primitives not listed here render with GenericCard.
import NoteCard from './NoteCard';
import ListCard from './ListCard';
import CodeSnippetCard from './CodeSnippetCard';
import MapCard from './MapCard';
import ProductCard from './ProductCard';
import ReceiptCard from './ReceiptCard';
import TicketCard from './TicketCard';
import MusicCard from './MusicCard';

export const CARD_COMPONENTS = {
  note: NoteCard,
  recommendation_list: ListCard,
  code_snippet: CodeSnippetCard,
  map_location: MapCard,
  product: ProductCard,
  receipt: ReceiptCard,
  ticket: TicketCard,
  music_track: MusicCard,
};
