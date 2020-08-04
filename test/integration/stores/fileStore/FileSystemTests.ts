import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { FileSystemFileStore } from '../../../../lib/stores/fileStore/FileSystem';
import { getTestsFor } from './getTestsFor';
import { isolated } from 'isolated';

suite('FileSystem', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      return await FileSystemFileStore.create({
        type: 'FileSystem',
        directory: await isolated()
      });
    }
  });
});
