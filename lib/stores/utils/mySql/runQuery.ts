import { MysqlError, PoolConnection } from 'mysql';

type Resolve = (value?: unknown) => void;
type Reject = (reason?: any) => void;
type Callback = (err: MysqlError | null) => void;

const getCallback = function (resolve: Resolve, reject: Reject): Callback {
  return function (err: null | MysqlError, rows?: any, fields?: any): void {
    if (err) {
      return reject(err);
    }

    resolve([ rows, fields ]);
  };
};

const runQuery = async function ({ connection, query, parameters }: {
  connection: PoolConnection;
  query: string;
  parameters?: any[];
}): Promise<any> {
  if (parameters) {
    return await new Promise((resolve, reject): void => {
      connection.query(query, parameters, getCallback(resolve, reject));
    });
  }

  return await new Promise((resolve, reject): void => {
    connection.query(query, getCallback(resolve, reject));
  });
};

export { runQuery };
