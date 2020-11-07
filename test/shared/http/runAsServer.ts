import { Application } from 'express';
import { getAvailablePort } from '../../../lib/common/utils/network/getAvailablePort';
import http from 'http';
import axios, { AxiosInstance } from 'axios';

const runAsServer = async function ({ app }: {
  app: Application;
}): Promise<{ client: AxiosInstance; port: number }> {
  const server = http.createServer(app);

  const port = await getAvailablePort();

  await new Promise((resolve, reject): void => {
    server.listen(port, (): void => {
      resolve();
    });

    server.on('error', (err): void => {
      reject(err);
    });
  });

  const axiosInstance = axios.create({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    baseURL: `http://localhost:${port}`
  });

  return { client: axiosInstance, port };
};

export { runAsServer };
