import mysql from 'mysql';

export const query = async function (connection: mysql.PoolConnection, sql: string, args?: any): Promise<any> {
  if (args) {
    return new Promise((resolve, reject): void => {
      connection.query(sql, args, (err: null | mysql.MysqlError, result?: any, fields?: any): void => {
        if (err) {
          reject(err);

          return;
        }
        resolve([ result, fields ]);
      });
    });
  }

  return new Promise((resolve, reject): void => {
    connection.query(sql, (err: null | mysql.MysqlError, result?: any, fields?: any): void => {
      if (err) {
        reject(err);

        return;
      }
      resolve([ result, fields ]);
    });
  });
};
