'use strict';

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../stores/eventstore');

suite('MariaDb', () => {
  getTestsFor({
    Eventstore: MariaDb,

    getOptions () {
      const { mariaDb } = getConnectionOptions({ type: 'integration' });

      return mariaDb;
    }
  });
});
