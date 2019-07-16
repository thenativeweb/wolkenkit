'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MySql } = require('../../../../stores/lockstore');

suite('MySql', () => {
  getTestsFor({
    Lockstore: MySql,
    type: 'MySql',

    getOptions () {
      const { mySql } = getConnectionOptions();

      return { ...mySql, maxLockSize: 2048 };
    }
  });
});
