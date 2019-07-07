'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory: Lockstore } = require('../../../../stores/lockstore'),
      { InMemory } = require('../../../../stores/commandstore');

suite('InMemory', () => {
  getTestsFor({
    Commandstore: InMemory,

    async getOptions ({ namespace }) {
      const lockstore = new Lockstore();

      await lockstore.initialize({ namespace, maxLockSize: 2048 });

      return {
        lockstore,
        namespace,
        expirationDuration: 50
      };
    }
  });
});
