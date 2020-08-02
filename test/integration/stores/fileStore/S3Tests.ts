import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { getTestsFor } from './getTestsFor';
import { S3FileStore } from '../../../../lib/stores/fileStore/S3';
import { v4 } from 'uuid';

suite('S3', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      return await S3FileStore.create({
        type: 'S3',
        ...connectionOptions.minio,
        bucketName: v4()
      });
    }
  });
});
