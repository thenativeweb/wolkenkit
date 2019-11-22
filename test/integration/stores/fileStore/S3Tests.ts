import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { getTestsFor } from './getTestsFor';
import { S3FileStore } from '../../../../lib/stores/fileStore/S3';
import { uuid } from 'uuidv4';

suite('S3', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      return await S3FileStore.create({
        ...connectionOptions.minio,
        bucketName: uuid()
      });
    }
  });
});
