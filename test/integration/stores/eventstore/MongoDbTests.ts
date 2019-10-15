import connectionOptions from '../../../shared/containers/connectionOptions';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import getTestsFor from './getTestsFor';
import MongoDbEventstore from '../../../../src/stores/eventstore/MongoDb';

suite('MongoDb', (): void => {
  getTestsFor({
    async createEventstore (namespace: string): Promise<Eventstore> {
      return await MongoDbEventstore.create({
        ...connectionOptions.mongoDb,
        namespace
      });
    }
  });
});
