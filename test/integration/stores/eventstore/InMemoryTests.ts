import { Eventstore } from '../../../../lib/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import InMemoryEventstore from '../../../../lib/stores/eventstore/InMemory';

suite('InMemory', (): void => {
  getTestsFor({
    async createEventstore (): Promise<Eventstore> {
      return await InMemoryEventstore.create();
    }
  });
});
