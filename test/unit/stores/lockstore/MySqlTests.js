'use strict';

const getTestsFor = require('./getTestsFor'),
      { MySql } = require('../../../../stores/lockstore');

suite('MySql', () => {
  getTestsFor({
    Lockstore: MySql,
    type: 'MySql'
  });
});
