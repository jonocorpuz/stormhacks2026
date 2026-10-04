// Primitive id -> custom card. Primitives not listed here render with GenericCard.
import NoteCard from './NoteCard';
import ListWidget from '../ListWidget';
import CodeSnippetWidget from '../CodeSnippetWidget';

export const CARD_COMPONENTS = {
  note: NoteCard,
  recommendation_list: ListWidget,
  code_snippet: CodeSnippetWidget,
};
