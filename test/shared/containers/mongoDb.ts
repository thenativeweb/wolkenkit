import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { MongoClient } from 'mongodb';
import { oneLine } from 'common-tags';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';
import { URL } from 'url';

const mongoDb = {
  async start (): Promise<void> {
    const {
      connectionString
    } = connectionOptions.mongoDb;

    const { username, password, hostname, pathname, port } = new URL(connectionString);
    const database = pathname.slice(1);

    shell.exec(oneLine`
      docker run
        -d
        -p 27017:27017
        -e MONGODB_ROOT_PASSWORD=${password}
        -e MONGODB_USERNAME=${username}
        -e MONGODB_PASSWORD=${password}
        -e MONGODB_DATABASE=${database}
        -e MONGODB_REPLICA_SET_MODE=primary
        -e MONGODB_REPLICA_SET_NAME=rs0
        -e MONGODB_REPLICA_SET_KEY=secret
        --name test-mongodb
        thenativeweb/wolkenkit-mongodb:latest
    `);

    const url = `mongodb://${username}:${password}@${hostname}:${port}/${database}`;

    try {
      await retry(async (): Promise<void> => {
        /* eslint-disable id-length */
        const client = await MongoClient.connect(
          url,
          { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
        );
        /* eslint-enable id-length */

        await client.close();
      }, retryOptions);
    } catch (ex: unknown) {
      buntstift.info((ex as Error).message);
      buntstift.error('Failed to connect to MongoDB.');
      throw ex;
    }
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-mongodb',
      'docker rm -v test-mongodb'
    ].join(';'));
  }
};

export { mongoDb };
