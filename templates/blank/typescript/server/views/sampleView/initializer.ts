import { SampleViewItem } from './SampleViewItem';
import { ViewInitializer } from 'wolkenkit';

export const initializer: ViewInitializer<SampleViewItem[]> = {
  storeType: 'infrastructure/inmemory',

  async initialize (): Promise<void> {
    // Intentionally left blank.
  }
};
