import { Filestore } from '../../../../lib/stores/filestore/Filestore';
import FileSystemFilestore from '../../../../lib/stores/filestore/FileSystem';
import getTestsFor from './getTestsFor';

suite('FileSystem', (): void => {
  getTestsFor({
    async createFilestore (): Promise<Filestore> {
      return await FileSystemFilestore.create({});
    }
  });
});
