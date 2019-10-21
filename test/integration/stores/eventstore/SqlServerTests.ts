import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../lib/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import SqlServerEventstore from '../../../../lib/stores/eventstore/SqlServer';

suite('SqlServer', (): void => {
  getTestsFor({
    async createEventstore (namespace: string): Promise<Eventstore> {
      return await SqlServerEventstore.create({
        ...connectionOptions.sqlServer,
        namespace
      });
    }
  });
});
