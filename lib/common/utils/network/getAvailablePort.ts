import { sleep } from '../sleep';
import { AddressInfo, createServer } from 'net';

const getAvailablePort = async function (): Promise<number> {
  return new Promise((resolve, reject): void => {
    const server = createServer();

    let port: number;

    server.once('listening', (): void => {
      ({ port } = (server.address() as AddressInfo));

      server.close(async (err): Promise<void> => {
        if (err) {
          return reject(err);
        }

        await sleep({ ms: 500 });
        resolve(port);
      });
    });

    server.once('error', (err): void => {
      reject(err);
    });

    server.listen(0, '127.0.0.1');
  });
};

export { getAvailablePort };
