'use strict';

const DsnParser = require('dsn-parser'),
      mysql = require('mysql2/promise'),
      retry = require('async-retry');

const waitForMysql = async function ({ url }) {
  if (!url) {
    throw new Error('Url is missing.');
  }

  const { host, port, user, password, database } = new DsnParser(url).getParts();

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database
  });

  await retry(async () => {
    const connection = await pool.getConnection();

    await connection.release();
  });

  await pool.end();
};

module.exports = waitForMysql;
