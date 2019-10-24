import { Collection } from 'mongodb';
import { ViewStore } from '../../../../../lib/common/elements/ViewStore';

export const store: ViewStore<Collection> = {
  type: 'infrastructure/mongodb',

  async setup (games): Promise<void> {
    await games.createIndex('id');
  }
};
