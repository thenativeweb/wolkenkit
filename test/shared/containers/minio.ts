import { buntstift } from 'buntstift';
import { Client } from 'minio';
import { connectionOptions } from './connectionOptions';
import { oneLine } from 'common-tags';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';
import { uuid } from 'uuidv4';

const minio = {
  async start (): Promise<void> {
    const {
      hostName,
      port,
      accessKey,
      secretKey,
      encryptConnection
    } = connectionOptions.minio;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:9000
        -e "MINIO_ACCESS_KEY=${accessKey}"
        -e "MINIO_SECRET_KEY=${secretKey}"
        --name test-minio
        thenativeweb/wolkenkit-minio:latest
        server
        /data
    `);

    try {
      await retry(async (): Promise<void> => {
        const client = new Client({
          endPoint: hostName,
          port,
          useSSL: encryptConnection,
          accessKey,
          secretKey
        });

        await client.bucketExists(uuid());
      }, retryOptions);
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to Minio.');
      throw ex;
    }
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-minio',
      'docker rm -v test-minio'
    ].join(';'));
  }
};

export { minio };
