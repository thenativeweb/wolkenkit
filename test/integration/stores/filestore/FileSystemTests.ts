import { Filestore } from '../../../../src/stores/filestore/Filestore';
import FileSystemFilestore from '../../../../src/stores/filestore/FileSystem';
import getTestsFor from './getTestsFor';

suite('FileSystem', (): void => {
  getTestsFor({
    async createFilestore (): Promise<Filestore> {
      return await FileSystemFilestore.create({});
    }
  });
});
