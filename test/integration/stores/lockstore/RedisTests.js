'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { Redis } = require('../../../../stores/lockstore');

suite('Redis', () => {
  getTestsFor({
    Lockstore: Redis,

    getOptions () {
      const { redis } = getConnectionOptions();

      return { ...redis, maxLockSize: 2048 };
    }
  });
});
