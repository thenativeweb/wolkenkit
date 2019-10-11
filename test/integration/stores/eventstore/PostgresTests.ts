import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import PostgresEventstore from '../../../../src/stores/eventstore/Postgres';

suite('Postgres', (): void => {
  getTestsFor({
    async eventstoreFactory (namespace: string): Promise<Eventstore> {
      return await PostgresEventstore.create({
        ...connectionOptions.postgres,
        namespace
      });
    }
  });
});
