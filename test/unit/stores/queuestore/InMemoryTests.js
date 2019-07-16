'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory } = require('../../../../stores/queuestore');

suite('InMemory', () => {
  getTestsFor({
    Queuestore: InMemory,
    type: 'InMemory'
  });
});
