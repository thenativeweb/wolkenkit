import connectionOptions from '../../../shared/containers/connectionOptions';
import { Filestore } from '../../../../lib/stores/filestore/Filestore';
import getTestsFor from './getTestsFor';
import S3Filestore from '../../../../lib/stores/filestore/S3';
import uuid from 'uuidv4';

suite('S3', (): void => {
  getTestsFor({
    async createFilestore (): Promise<Filestore> {
      return await S3Filestore.create({
        ...connectionOptions.minio,
        bucketName: uuid()
      });
    }
  });
});
