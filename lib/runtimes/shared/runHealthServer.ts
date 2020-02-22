import express from 'express';
import { flaschenpost } from 'flaschenpost';
import { getApi } from '../../apis/getHealth/http';
import { getCorsOrigin } from 'get-cors-origin';
import http from 'http';

const logger = flaschenpost.getLogger();

const runHealthServer = async function ({ corsOrigin, port }: {
  corsOrigin: string | string[];
  port: number;
}): Promise<void> {
  const app = express();

  const { api } = await getApi({
    corsOrigin: getCorsOrigin(corsOrigin)
  });

  app.use('/health', api);

  const server = http.createServer(app);

  return new Promise((resolve): void => {
    server.listen(port, (): void => {
      logger.info('Health server started.', { healthPort: port });

      resolve();
    });
  });
};

export { runHealthServer };
