'use strict';

const Eventstore = require('../../../../../storage/eventstore/inmemory/Eventstore'),
      getTestsFor = require('../getTestsFor');

suite('inmemory/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'inmemory'
  });
});
