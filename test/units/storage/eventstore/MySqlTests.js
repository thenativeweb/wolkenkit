'use strict';

const getTestsFor = require('./getTestsFor'),
      { MySql } = require('../../../../storage/eventstore');

suite('MySql', () => {
  getTestsFor({
    Eventstore: MySql,
    type: 'MySql'
  });
});
