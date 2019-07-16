'use strict';

const getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../stores/lockstore');

suite('MariaDb', () => {
  getTestsFor({
    Lockstore: MariaDb,
    type: 'MariaDb'
  });
});
