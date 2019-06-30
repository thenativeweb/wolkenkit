'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../stores/lockstore');

suite('SqlServer', () => {
  getTestsFor({
    Lockstore: SqlServer,

    getOptions () {
      const { sqlServer } = getConnectionOptions();

      return sqlServer;
    }
  });
});
