'use strict';

const InMemory = require('./InMemory'),
      MariaDb = require('./MariaDb'),
      MySql = require('./MySql'),
      Postgres = require('./Postgres');

module.exports = {
  InMemory,
  MariaDb,
  MySql,
  Postgres
};
