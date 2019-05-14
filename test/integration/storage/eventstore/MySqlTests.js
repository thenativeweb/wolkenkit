'use strict';

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MySql } = require('../../../../stores/eventstore');

suite('MySql', () => {
  getTestsFor({
    Eventstore: MySql,

    getOptions () {
      const { mySql } = getConnectionOptions({ type: 'integration' });

      return mySql;
    }
  });
});
