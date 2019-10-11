import connectionOptions from '../../../shared/containers/connectionOptions';
import { Filestore } from '../../../../src/stores/filestore/Filestore';
import getTestsFor from './getTestsFor';
import S3Filestore from '../../../../src/stores/filestore/S3';
import uuid from 'uuidv4';

suite('S3', (): void => {
  getTestsFor({
    async filestoreFactory (): Promise<Filestore> {
      return await S3Filestore.create({
        ...connectionOptions.minio,
        bucketName: uuid()
      });
    }
  });
});
