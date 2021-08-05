import { ConnectionOptions } from 'tls';
import { PostgresConnectionOptions } from './PostgresConnectionOptions';

const convertEncryptConnectionToConnectionOptions = function ({ encryptConnection }: {
  encryptConnection?: boolean | PostgresConnectionOptions;
}): boolean | ConnectionOptions | undefined {
  if (encryptConnection === undefined) {
    return undefined;
  }
  if (typeof encryptConnection === 'boolean') {
    return encryptConnection;
  }

  return {
    rejectUnauthorized: encryptConnection.rejectUnauthorized,
    ca: encryptConnection.ca,
    cert: encryptConnection.certificate,
    key: encryptConnection.privateKey
  };
};

export {
  convertEncryptConnectionToConnectionOptions
};
