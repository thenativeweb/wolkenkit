'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory } = require('../../../../storage/eventstore');

suite('InMemory', () => {
  getTestsFor({
    Eventstore: InMemory,

    getOptions () {
      return {};
    }
  });
});
