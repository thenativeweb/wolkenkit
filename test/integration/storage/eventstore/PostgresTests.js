'use strict';

const connectionStrings = require('../../../shared/connectionStrings'),
      getTestsFor = require('./getTestsFor'),
      { Postgres } = require('../../../../storage/eventstore');

suite('Postgres', () => {
  getTestsFor({
    Eventstore: Postgres,
    type: 'Postgres',
    url: connectionStrings.postgres.integrationTests
  });
});
