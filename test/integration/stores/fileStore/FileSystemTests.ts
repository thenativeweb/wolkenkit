import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { FileSystemFileStore } from '../../../../lib/stores/fileStore/FileSystem';
import { getTestsFor } from './getTestsFor';

suite('FileSystem', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      return await FileSystemFileStore.create({});
    }
  });
});
