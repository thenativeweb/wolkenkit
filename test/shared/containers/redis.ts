import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { oneLine } from 'common-tags';
import Redis from 'ioredis';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';

const redis = {
  async start (): Promise<void> {
    const {
      hostName,
      port,
      password,
      database
    } = connectionOptions.redis;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:6379
        --name test-redis
        thenativeweb/wolkenkit-redis:latest
        redis-server --requirepass ${password}
    `);

    try {
      await retry(async (): Promise<void> => {
        const client = new Redis({
          host: hostName,
          port,
          password,
          db: database
        });

        await client.ping();
        await client.quit();
      }, retryOptions);
    } catch (ex: unknown) {
      buntstift.info((ex as Error).message);
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

export { redis };
