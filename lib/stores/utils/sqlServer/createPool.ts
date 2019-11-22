import { Connection } from 'tedious';
import { noop } from 'lodash';
import { Pool } from 'tarn';

const createPool = function ({
  host,
  port,
  user,
  password,
  database,
  encrypt,
  onError = noop,
  onDisconnect = noop
}: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  encrypt: boolean;
  onError: (err: Error) => void;
  onDisconnect: () => void;
}): Pool<Connection> {
  const pool = new Pool<Connection>({
    min: 2,
    max: 10,
    acquireTimeoutMillis: 1000,
    createTimeoutMillis: 1000,
    idleTimeoutMillis: 1000,
    propagateCreateError: true,

    async create (): Promise<Connection> {
      return new Promise((resolve, reject): void => {
        const connection = new Connection({
          server: host,
          options: { port, database, encrypt },
          authentication: {
            type: 'default',
            options: { userName: user, password }
          }
        });

        let handleConnect: (err: Error | null) => void,
            handleEnd: () => void,
            handleError: (err: Error) => void,
            hasBeenConnected = false;

        const unsubscribe = (): void => {
          connection.removeListener('connect', handleConnect);
          connection.removeListener('error', handleError);
          connection.removeListener('end', handleEnd);
        };

        const unsubscribeSetup = (): void => {
          connection.removeListener('connect', handleConnect);
        };

        handleConnect = (err: Error | null): void => {
          if (err) {
            unsubscribe();

            return reject(err);
          }

          hasBeenConnected = true;
          unsubscribeSetup();
          resolve(connection);
        };

        handleError = (err: Error): void => {
          unsubscribe();

          onError(err);
        };

        handleEnd = (): void => {
          unsubscribe();

          if (!hasBeenConnected) {
            return reject(new Error('Could not connect to database.'));
          }

          onDisconnect();
        };

        connection.on('connect', handleConnect);
        connection.on('error', handleError);
        connection.on('end', handleEnd);
      });
    },

    destroy (connection): void {
      connection.removeAllListeners('end');
      connection.removeAllListeners('error');

      connection.close();
    }
  });

  return pool;
};

export { createPool };
