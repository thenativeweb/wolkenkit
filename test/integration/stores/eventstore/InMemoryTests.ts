import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import InMemoryEventstore from '../../../../src/stores/eventstore/InMemory';

suite('InMemory', (): void => {
  getTestsFor({
    async createEventstore (): Promise<Eventstore> {
      return await InMemoryEventstore.create();
    }
  });
});
