'use strict';

const Eventstore = require('../../../../../storage/eventstore/mysql/Eventstore'),
      getTestsFor = require('../getTestsFor');

suite('mysql/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'mysql'
  });
});
