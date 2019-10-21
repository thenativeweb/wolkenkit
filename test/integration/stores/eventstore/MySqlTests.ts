import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../lib/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import MySqlEventstore from '../../../../lib/stores/eventstore/MySql';

suite('MySql', (): void => {
  getTestsFor({
    async createEventstore (namespace: string): Promise<Eventstore> {
      return await MySqlEventstore.create({
        ...connectionOptions.mySql,
        namespace
      });
    }
  });
});
