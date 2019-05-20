'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../stores/eventstore');

suite('SqlServer', () => {
  getTestsFor({
    Eventstore: SqlServer,

    getOptions () {
      const { sqlServer } = getConnectionOptions();

      return sqlServer;
    }
  });
});
