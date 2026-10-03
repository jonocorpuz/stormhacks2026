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
