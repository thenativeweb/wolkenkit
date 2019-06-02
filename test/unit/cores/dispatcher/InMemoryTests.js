'use strict';

const getTestsFor = require('./getTestsFor'),
      { InMemory } = require('../../../../cores/dispatcher');

suite('InMemory', () => {
  getTestsFor({ Dispatcher: InMemory });
});
