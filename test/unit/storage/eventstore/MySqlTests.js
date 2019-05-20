'use strict';

const getTestsFor = require('./getTestsFor'),
      { MySql } = require('../../../../stores/eventstore');

suite('MySql', () => {
  getTestsFor({
    Eventstore: MySql,
    type: 'MySql'
  });
});
