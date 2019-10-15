import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import SqlServerEventstore from '../../../../src/stores/eventstore/SqlServer';

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
