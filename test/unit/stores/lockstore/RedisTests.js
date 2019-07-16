'use strict';

const getTestsFor = require('./getTestsFor'),
      { Redis } = require('../../../../stores/lockstore');

suite('Redis', () => {
  getTestsFor({
    Lockstore: Redis,
    type: 'Redis'
  });
});
