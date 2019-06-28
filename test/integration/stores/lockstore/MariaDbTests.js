'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../stores/lockstore');

suite('MariaDb', () => {
  getTestsFor({
    Lockstore: MariaDb,

    getOptions () {
      const { mariaDb } = getConnectionOptions();

      return mariaDb;
    }
  });
});
