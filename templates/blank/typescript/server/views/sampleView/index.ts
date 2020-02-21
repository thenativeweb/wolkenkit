import { all } from './queries/all';
import { initializer } from './initializer';
import { sampleProjection } from './projections/sampleProjection';
import { SampleViewItem } from './SampleViewItem';
import { View } from 'wolkenkit';

const sampleView: View<SampleViewItem[]> = {
  initializer,
  projectionHandlers: {
    sampleProjection
  },
  queryHandlers: {
    all
  }
};

export default sampleView;
