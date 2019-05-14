'use strict';

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../stores/eventstore');

suite('SqlServer', () => {
  getTestsFor({
    Eventstore: SqlServer,

    getOptions () {
      const { sqlServer } = getConnectionOptions({ type: 'integration' });

      return sqlServer;
    }
  });
});
