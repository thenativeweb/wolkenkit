import { SampleViewItem } from './SampleViewItem';
// @ts-ignore
import { ViewInitializer } from 'wolkenkit';

export const initializer: ViewInitializer<SampleViewItem[]> = {
  storeType: 'infrastructure/inmemory',

  async initialize (): Promise<void> {
    // Intentionally left blank.
  }
};
