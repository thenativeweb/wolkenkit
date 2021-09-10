import { AzureFileStore } from '../../../../lib/stores/fileStore/Azure';
import { connectionOptions } from '../../../shared/containers/connectionOptions';
import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { getTestsFor } from './getTestsFor';

suite('Azure', (): void => {
  getTestsFor({
    async createFileStore (): Promise<FileStore> {
      return await AzureFileStore.create({
        type: 'Azure',
        ...connectionOptions.azurite
      });
    }
  });
});
