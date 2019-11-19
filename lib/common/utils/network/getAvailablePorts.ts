import { sleep } from '../sleep';
import { AddressInfo, createServer, Server } from 'net';

const servers: Record<number, Server | undefined> = {};

const lockPort = async function (): Promise<number> {
  return new Promise((resolve, reject): void => {
    const server = createServer();

    let port: number;

    server.once('listening', async (): Promise<void> => {
      ({ port } = (server.address() as AddressInfo));

      servers[port] = server;

      await sleep({ ms: 50 });
      resolve(port);
    });

    server.once('error', (err): void => {
      reject(err);
    });

    server.listen(0, '127.0.0.1');
  });
};

const releasePort = async function ({ port }: { port: number }): Promise<void> {
  const server = servers[port];

  if (!server) {
    throw new Error(`Port ${port} is not locked.`);
  }

  await new Promise((resolve, reject): void => {
    server.close(async (err): Promise<void> => {
      if (err) {
        return reject(err);
      }

      await sleep({ ms: 50 });
      resolve();
    });
  });
};

const getAvailablePorts = async function ({ count }: {
  count: number;
}): Promise<number[]> {
  const availablePorts = [];

  for (let i = 0; i < count; i++) {
    availablePorts.push(await lockPort());
  }

  for (const availablePort of availablePorts) {
    await releasePort({ port: availablePort });
  }

  return availablePorts;
};

export { getAvailablePorts };
