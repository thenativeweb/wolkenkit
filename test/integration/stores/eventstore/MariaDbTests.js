'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../stores/eventstore');

suite('MariaDb', () => {
  getTestsFor({
    Eventstore: MariaDb,

    getOptions () {
      const { mariaDb } = getConnectionOptions();

      return mariaDb;
    }
  });
});
