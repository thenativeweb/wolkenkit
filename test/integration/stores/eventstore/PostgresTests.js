'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { Postgres } = require('../../../../stores/eventstore');

suite('Postgres', () => {
  getTestsFor({
    Eventstore: Postgres,

    getOptions () {
      const { postgres } = getConnectionOptions();

      return postgres;
    }
  });
});
