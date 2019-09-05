import buntstift from 'buntstift';
import connectionOptions from './connectionOptions';
import { oneLine } from 'common-tags';
import redisClient from 'redis';
import retry from 'async-retry';
import retryOptions from './retryOptions';
import shell from 'shelljs';

const redis = {
  async start (): Promise<void> {
    const {
      hostname,
      port,
      password
    } = connectionOptions.redis;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:6379
        --name test-redis
        thenativeweb/wolkenkit-redis:latest
        redis-server --requirepass ${password}
    `);

    const url = `redis://:${password}@${hostname}:${port}/0`;

    try {
      await retry(async (): Promise<void> => new Promise((resolve: (value?: void) => void, reject: (reason?: any) => void): any => {
        const client = redisClient.createClient({ url });

        client.ping((err: Error | null): void => {
          if (err) {
            reject(err);
          }

          client.quit();
          resolve();
        });
      }), retryOptions);
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to Redis.');
      throw ex;
    }
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-redis',
      'docker rm -v test-redis'
    ].join(';'));
  }
};

export default redis;
