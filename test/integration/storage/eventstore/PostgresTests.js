'use strict';

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { Postgres } = require('../../../../stores/eventstore');

suite('Postgres', () => {
  getTestsFor({
    Eventstore: Postgres,

    getOptions () {
      const { postgres } = getConnectionOptions({ type: 'integration' });

      return postgres;
    }
  });
});
