'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory } = require('../../../../stores/lockstore');

suite('InMemory', () => {
  getTestsFor({
    Lockstore: InMemory,

    getOptions () {
      return { maxLockSize: 2048 };
    }
  });
});
