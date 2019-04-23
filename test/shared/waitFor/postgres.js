'use strict';

const DsnParser = require('dsn-parser'),
      pg = require('pg'),
      retry = require('async-retry');

const waitForPostgres = async function ({ url }) {
  if (!url) {
    throw new Error('Url is missing.');
  }

  const { host, port, user, password, database } = new DsnParser(url).getParts();

  const pool = new pg.Pool({ host, port, user, password, database });

  await retry(async () => {
    const connection = await pool.connect();

    connection.release();
  });

  await pool.end();
};

module.exports = waitForPostgres;
