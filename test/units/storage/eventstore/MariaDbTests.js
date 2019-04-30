'use strict';

const getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../storage/eventstore');

suite('MariaDb', () => {
  getTestsFor({
    Eventstore: MariaDb,
    type: 'MariaDb'
  });
});
