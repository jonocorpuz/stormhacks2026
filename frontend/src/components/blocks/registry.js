// Block id (from model) -> how to view / edit a value of that block.
// Add a new block here once the model defines it. Nothing else needs to change.
import { TextInput, TextView } from './TextBlock';
import { LongtextInput, LongtextView } from './LongtextBlock';
import { ListInput, ListView } from './ListBlock';

export const BLOCK_RENDERERS = {
  text: { View: TextView, Input: TextInput },
  longtext: { View: LongtextView, Input: LongtextInput },
  list: { View: ListView, Input: ListInput },
};
