'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { Postgres } = require('../../../../stores/lockstore');

suite('Postgres', () => {
  getTestsFor({
    Lockstore: Postgres,
    type: 'Postgres',

    getOptions () {
      const { postgres } = getConnectionOptions();

      return { ...postgres, maxLockSize: 2048 };
    }
  });
});
