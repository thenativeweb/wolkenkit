'use strict';

const getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../stores/eventstore');

suite('MariaDb', () => {
  getTestsFor({
    Eventstore: MariaDb,
    type: 'MariaDb'
  });
});
