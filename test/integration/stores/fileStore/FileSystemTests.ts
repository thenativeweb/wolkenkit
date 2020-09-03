import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { FileSystemFileStore } from '../../../../lib/stores/fileStore/FileSystem';
import { getTestsFor } from './getTestsFor';
import { isolated } from 'isolated';
import path from 'path';

suite('FileSystem', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      const temporaryDirectory = await isolated();
      const storeDirectory = path.join(temporaryDirectory, 'fileStore');

      return await FileSystemFileStore.create({
        type: 'FileSystem',
        directory: storeDirectory
      });
    }
  });
});
