import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import MySqlEventstore from '../../../../src/stores/eventstore/MySql';

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
