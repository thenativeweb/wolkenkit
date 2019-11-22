import { all } from './queries/all';
import { executed } from './projections/executed';
import { initializer } from './initializer';
import { SampleViewItem } from './SampleViewItem';
// @ts-ignore
import { View } from 'wolkenkit';

const sampleView: View<SampleViewItem[]> = {
  initializer,
  projectionHandlers: {
    executed
  },
  queryHandlers: {
    all
  }
};

export default sampleView;
