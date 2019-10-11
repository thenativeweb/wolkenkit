import mysql from 'mysql';

type Resolve = (value?: unknown) => void;
type Reject = (reason?: any) => void;
type Callback = (err: null | mysql.MysqlError) => void;

const getCallback = function (resolve: Resolve, reject: Reject): Callback {
  return function (err: null | mysql.MysqlError): void {
    if (err) {
      return reject(err);
    }

    resolve();
  };
};

export const query = async function (connection: mysql.PoolConnection, sql: string, args?: any): Promise<any> {
  if (args) {
    await new Promise((resolve, reject): void => {
      connection.query(sql, args, getCallback(resolve, reject));
    });
  }

  await new Promise((resolve, reject): void => {
    connection.query(sql, getCallback(resolve, reject));
  });
};
