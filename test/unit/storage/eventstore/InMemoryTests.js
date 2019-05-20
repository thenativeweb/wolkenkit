'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory } = require('../../../../stores/eventstore');

suite('InMemory', () => {
  getTestsFor({
    Eventstore: InMemory,
    type: 'InMemory'
  });
});
