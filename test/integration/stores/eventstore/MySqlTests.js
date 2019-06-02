'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MySql } = require('../../../../stores/eventstore');

suite('MySql', () => {
  getTestsFor({
    Eventstore: MySql,

    getOptions () {
      const { mySql } = getConnectionOptions();

      return mySql;
    }
  });
});
