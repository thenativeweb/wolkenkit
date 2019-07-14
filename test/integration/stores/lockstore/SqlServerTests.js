'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../stores/lockstore');

suite('SqlServer', () => {
  getTestsFor({
    Lockstore: SqlServer,
    type: 'SqlServer',

    getOptions () {
      const { sqlServer } = getConnectionOptions();

      // This is SqlServer max size for a clustered index key.
      // Limit is applied on the sum of namespace + value...
      return { ...sqlServer, maxLockSize: 828 };
    }
  });
});
