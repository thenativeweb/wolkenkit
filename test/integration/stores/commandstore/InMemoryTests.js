'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory } = require('../../../../stores/commandstore');

suite('InMemory', () => {
  getTestsFor({
    Commandstore: InMemory,

    getOptions () {
      return {
        expirationDuration: 50
      };
    }
  });
});
