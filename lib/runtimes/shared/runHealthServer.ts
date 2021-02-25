import express from 'express';
import { flaschenpost } from 'flaschenpost';
import { getApi } from '../../apis/getHealth/http';
import { getCorsOrigin } from 'get-cors-origin';
import http from 'http';
import { withLogMetadata } from '../../common/utils/logging/withLogMetadata';

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
      logger.info(
        'Started health server.',
        withLogMetadata('runtime', 'shared/health', { healthPortOrSocket: portOrSocket })
      );

      resolve();
    });
  });
};

export { runHealthServer };
