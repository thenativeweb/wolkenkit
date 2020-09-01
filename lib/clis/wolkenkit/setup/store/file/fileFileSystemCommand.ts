import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createFileStore } from '../../../../../stores/fileStore/createFileStore';
import { FileFileSystemOptions } from './FileFileSystemOptions';
import { FileStoreOptions } from '../../../../../stores/fileStore/FileStoreOptions';
import path from 'path';

const fileFileSystemCommand = function (): Command<FileFileSystemOptions> {
  return {
    name: 'file-system',
    description: 'Sets up an S3 file store.',

    optionDefinitions: [
      {
        name: 'directory',
        type: 'string',
        parameterName: 'path',
        isRequired: true
      }
    ],

    async handle ({
      options: {
        directory,
        verbose
      }
    }): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeDirectory = path.resolve(process.cwd(), directory);

      const storeOptions: FileStoreOptions = {
        type: 'FileSystem',
        directory: storeDirectory
      };

      try {
        const store = await createFileStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up file system file store.');
      } catch (ex) {
        buntstift.error('Failed to set up file system file store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { fileFileSystemCommand };
