'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory } = require('../../../../stores/lockstore');

suite('InMemory', () => {
  getTestsFor({
    Lockstore: InMemory,
    type: 'InMemory',

    getOptions () {
      return { maxLockSize: 2048 };
    }
  });
});
