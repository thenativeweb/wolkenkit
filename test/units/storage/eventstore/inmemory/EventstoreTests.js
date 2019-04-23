'use strict';

const Eventstore = require('../../../../../storage/eventstore/inmemory/Eventstore'),
      getTestsFor = require('../getTestsFor');

suite('[storage/eventstore] inmemory/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'inmemory'
  });
});
