import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../lib/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import MariaDbEventstore from '../../../../lib/stores/eventstore/MariaDb';

suite('MariaDb', (): void => {
  getTestsFor({
    async createEventstore (namespace: string): Promise<Eventstore> {
      return await MariaDbEventstore.create({
        ...connectionOptions.mariaDb,
        namespace
      });
    }
  });
});
