'use strict';

const getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../stores/lockstore');

suite('MongoDb', () => {
  getTestsFor({
    Lockstore: MongoDb,
    type: 'MongoDb'
  });
});
