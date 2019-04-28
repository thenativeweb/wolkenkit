'use strict';

const Eventstore = require('../../../../../storage/eventstore/postgres/Eventstore'),
      getTestsFor = require('../getTestsFor');

suite('postgres/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'postgres'
  });
});
