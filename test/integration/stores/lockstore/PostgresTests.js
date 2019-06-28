'use strict';

const getTestsFor = require('./getTestsFor'),
      { Postgres } = require('../../../../stores/lockstore');

suite('Postgres', () => {
  getTestsFor({
    Lockstore: Postgres,

    getOptions () {
      return {};
    }
  });
});
