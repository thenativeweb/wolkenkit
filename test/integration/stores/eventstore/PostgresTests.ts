import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../lib/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import PostgresEventstore from '../../../../lib/stores/eventstore/Postgres';

suite('Postgres', (): void => {
  getTestsFor({
    async createEventstore (namespace: string): Promise<Eventstore> {
      return await PostgresEventstore.create({
        ...connectionOptions.postgres,
        namespace
      });
    }
  });
});
