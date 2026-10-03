export interface RecommendationItem {
  id: string;
  title: string;
  isChecked: boolean;
}

export interface RecommendationWidgetData {
  title: string;
  date: string;
  items: RecommendationItem[];
}
