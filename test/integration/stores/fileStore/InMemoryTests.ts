import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { InMemoryFileStore } from '../../../../lib/stores/fileStore/InMemory';
import { getTestsFor } from './getTestsFor';

suite('InMemory', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      return await InMemoryFileStore.create();
    }
  });
});
