'use strict';

const getTestsFor = require('./getTestsFor'),
      { Postgres } = require('../../../../storage/eventstore');

suite('Postgres', () => {
  getTestsFor({
    Eventstore: Postgres,
    type: 'Postgres'
  });
});
