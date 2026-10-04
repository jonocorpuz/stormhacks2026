// Block id (from model) -> how to view / edit a value of that block.
// Add a new block here once the model defines it. Nothing else needs to change.
import { TextInput, TextView } from './TextBlock';
import { LongtextInput, LongtextView } from './LongtextBlock';
import { ListInput, ListView } from './ListBlock';
import { NumberInput, NumberView } from './NumberBlock';
import { LineItemsInput, LineItemsView } from './LineItemsBlock';

export const BLOCK_RENDERERS = {
  text: { View: TextView, Input: TextInput },
  longtext: { View: LongtextView, Input: LongtextInput },
  list: { View: ListView, Input: ListInput },
  number: { View: NumberView, Input: NumberInput },
  line_items: { View: LineItemsView, Input: LineItemsInput },
};
