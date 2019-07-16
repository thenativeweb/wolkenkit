'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../stores/lockstore');

suite('MariaDb', () => {
  getTestsFor({
    Lockstore: MariaDb,
    type: 'MariaDb',

    getOptions () {
      const { mariaDb } = getConnectionOptions();

      return { ...mariaDb, maxLockSize: 2048 };
    }
  });
});
