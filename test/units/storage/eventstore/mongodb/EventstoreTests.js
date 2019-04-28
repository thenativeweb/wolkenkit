'use strict';

const Eventstore = require('../../../../../storage/eventstore/mongodb/Eventstore'),
      getTestsFor = require('../getTestsFor');

suite('mongodb/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'mongodb'
  });
});
