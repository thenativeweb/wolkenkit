'use strict';

const getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../storage/eventstore');

suite('MongoDb', () => {
  getTestsFor({
    Eventstore: MongoDb,
    type: 'MongoDb'
  });
});
