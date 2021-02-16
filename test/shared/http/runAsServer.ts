import { Application } from 'express';
import { getSocketPaths } from '../getSocketPaths';
import http from 'http';
import axios, { AxiosInstance } from 'axios';

const runAsServer = async function ({ app }: {
  app: Application;
}): Promise<{ client: AxiosInstance; socket: string }> {
  const server = http.createServer(app);

  const [ socket ] = await getSocketPaths({ count: 1 });

  await new Promise<void>((resolve, reject): void => {
    server.listen(socket, (): void => {
      resolve();
    });

    server.on('error', (err): void => {
      reject(err);
    });
  });

  const axiosInstance = axios.create({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    baseURL: `http://localhost`,
    socketPath: socket
  });

  return { client: axiosInstance, socket };
};

export { runAsServer };
