'use strict';

const getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../stores/eventstore');

suite('MongoDb', () => {
  getTestsFor({
    Eventstore: MongoDb,
    type: 'MongoDb'
  });
});
