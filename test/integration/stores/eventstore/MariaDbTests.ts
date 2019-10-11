import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import MariaDbEventstore from '../../../../src/stores/eventstore/MariaDb';

suite('MariaDb', (): void => {
  getTestsFor({
    async eventstoreFactory (namespace: string): Promise<Eventstore> {
      return await MariaDbEventstore.create({
        ...connectionOptions.mariaDb,
        namespace
      });
    }
  });
});
