import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { oneLine } from 'common-tags';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const azurite = {
  async start (): Promise<void> {
    const {
      accountName,
      accountKey,
      hostName,
      port
    } = connectionOptions.azurite;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:10000
        --name test-azurite
        thenativeweb/wolkenkit-azurite:latest
    `);

    try {
      await retry(async (): Promise<void> => {
        const url = `http://${hostName}:${port}/${accountName}`;
        const credential = new StorageSharedKeyCredential(
          accountName,
          accountKey
        );

        const client = new BlobServiceClient(
          url,
          credential
        );

        for await (const container of client.listContainers()) {
          buntstift.info(container.name);
        }
      }, retryOptions);
    } catch (ex: unknown) {
      buntstift.info((ex as Error).message);
      buntstift.error('Failed to connect to Azurite.');
      throw ex;
    }
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-azurite',
      'docker rm -v test-azurite'
    ].join(';'));
  }
};

export { azurite };
