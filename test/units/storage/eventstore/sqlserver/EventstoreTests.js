'use strict';

const Eventstore = require('../../../../../storage/eventstore/sqlserver/Eventstore'),
      getTestsFor = require('../getTestsFor');

suite('sqlserver/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'sqlserver'
  });
});
