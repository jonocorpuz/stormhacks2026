// Primitive id -> custom card. Primitives not listed here render with GenericCard.
import NoteCard from './NoteCard';
import ListCard from './ListCard';
import CodeSnippetCard from './CodeSnippetCard';
import MapCard from './MapCard';

export const CARD_COMPONENTS = {
  note: NoteCard,
  recommendation_list: ListCard,
  code_snippet: CodeSnippetCard,
  map_location: MapCard,
};
