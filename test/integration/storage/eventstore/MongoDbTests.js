'use strict';

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../storage/eventstore');

suite('MongoDb', () => {
  getTestsFor({
    Eventstore: MongoDb,

    getOptions () {
      const { mongoDb } = getConnectionOptions({ type: 'integration' });

      return mongoDb;
    }
  });
});
