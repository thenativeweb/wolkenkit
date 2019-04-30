'use strict';

const connectionStrings = require('../../../shared/connectionStrings'),
      getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../storage/eventstore');

suite('MongoDb', () => {
  getTestsFor({
    Eventstore: MongoDb,
    type: 'MongoDb',
    url: connectionStrings.mongoDb.integrationTests
  });
});
