import { createPool as mySqlCreatePool, Pool } from 'mysql';

const createPoolWithDefaults = function ({
  hostName,
  port,
  userName,
  password,
  database
}: {
  hostName: string;
  port: number;
  userName: string;
  password: string;
  database: string;
}): Pool {
  return mySqlCreatePool({
    host: hostName,
    port,
    user: userName,
    password,
    database,
    connectTimeout: 0,
    multipleStatements: true,
    charset: 'utf8mb4'
  });
};

export {
  createPoolWithDefaults
};
