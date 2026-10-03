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
