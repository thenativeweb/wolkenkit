import net, { AddressInfo } from 'net';

const getAvailablePort = async function (): Promise<number> {
  return new Promise((resolve, reject): void => {
    const server = net.createServer();

    let port: number;

    server.once('listening', (): void => {
      ({ port } = (server.address() as AddressInfo));
      server.close();
    });

    server.once('close', (): void => {
      resolve(port);
    });

    server.once('error', (err): void => {
      reject(err);
    });

    server.listen(0, '127.0.0.1');
  });
};

export default getAvailablePort;
