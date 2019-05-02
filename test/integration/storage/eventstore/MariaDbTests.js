'use strict';

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../storage/eventstore');

suite('MariaDb', () => {
  getTestsFor({
    Eventstore: MariaDb,

    getOptions () {
      const { mariaDb } = getConnectionOptions({ type: 'integration' });

      return mariaDb;
    }
  });
});
