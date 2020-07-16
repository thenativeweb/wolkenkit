import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { getTestsFor } from './getTestsFor';
import { InMemoryFileStore } from '../../../../lib/stores/fileStore/InMemory';

suite('InMemory', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      return await InMemoryFileStore.create();
    }
  });
});
