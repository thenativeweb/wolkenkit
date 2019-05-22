'use strict';

const getTestsFor = require('./getTestsFor'),
      { Postgres } = require('../../../../stores/eventstore');

suite('Postgres', () => {
  getTestsFor({
    Eventstore: Postgres,
    type: 'Postgres'
  });
});
