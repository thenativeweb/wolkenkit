import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createFileStore } from '../../../../../stores/fileStore/createFileStore';
import { FileS3Options } from './FileS3Options';
import { FileStoreOptions } from '../../../../../stores/fileStore/FileStoreOptions';

const fileS3Command = function (): Command<FileS3Options> {
  return {
    name: 's3',
    description: 'Set up an S3 file store.',

    optionDefinitions: [
      {
        name: 'host-name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'port',
        type: 'number',
        isRequired: true
      },
      {
        name: 'enrypt-connection',
        type: 'boolean',
        defaultValue: false
      },
      {
        name: 'access-key',
        type: 'string',
        isRequired: true
      },
      {
        name: 'secret-key',
        type: 'string',
        isRequired: true
      },
      {
        name: 'region',
        type: 'string'
      },
      {
        name: 'bucket-name',
        type: 'string',
        isRequired: true
      }
    ],

    async handle ({
      options: {
        'host-name': hostName,
        port,
        'encrypt-connection': encryptConnection,
        'access-key': accessKey,
        'secret-key': secretKey,
        region,
        'bucket-name': bucketName,
        verbose
      }
    }): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      const storeOptions: FileStoreOptions = {
        type: 'S3',
        hostName,
        port,
        encryptConnection,
        accessKey,
        secretKey,
        region,
        bucketName
      };

      try {
        buntstift.info('Setting up the S3 file store...');

        const store = await createFileStore(storeOptions);

        await store.setup();
        await store.destroy();
        buntstift.success('Successfully set up the S3 file store.');
      } catch (ex: unknown) {
        buntstift.error('Failed to set up the S3 file store.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { fileS3Command };
