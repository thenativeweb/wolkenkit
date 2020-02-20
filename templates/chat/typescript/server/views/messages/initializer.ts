import { MessagesItem } from './MessagesItem';
import { ViewInitializer } from 'wolkenkit';

export const initializer: ViewInitializer<MessagesItem[]> = {
  storeType: 'infrastructure/inmemory',

  async initialize (): Promise<void> {
    // Intentionally left blank.
  }
};
