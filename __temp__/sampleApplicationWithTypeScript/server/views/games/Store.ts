import { Collection } from 'mongodb';
import { ViewStore } from '../../../elements';

export class Store extends ViewStore<Collection> {
  public constructor (
    public name = 'infrastructure/mongodb'
  ) {
    super();
  }

  /* eslint-disable class-methods-use-this */
  public async setup (games: Collection): Promise<void> {
    await games.createIndex('id');
  }
  /* eslint-enable class-methods-use-this */
}
