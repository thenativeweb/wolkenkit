import express from 'express';
import { flaschenpost } from 'flaschenpost';
import { getApi } from '../../apis/getHealth/http';
import { getCorsOrigin } from 'get-cors-origin';
import http from 'http';

const logger = flaschenpost.getLogger();

const runHealthServer = async function ({ corsOrigin, portOrSocket }: {
  corsOrigin: string | string[];
  portOrSocket: number | string;
}): Promise<void> {
  const app = express();

  const { api } = await getApi({
    corsOrigin: getCorsOrigin(corsOrigin)
  });

  app.use('/health', api);

  const server = http.createServer(app);

  return new Promise((resolve): void => {
    server.listen(portOrSocket, (): void => {
      logger.info('Health server started.', { healthPortOrSocket: portOrSocket });

      resolve();
    });
  });
};

export { runHealthServer };
