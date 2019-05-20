'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../stores/eventstore');

suite('MongoDb', () => {
  getTestsFor({
    Eventstore: MongoDb,

    getOptions () {
      const { mongoDb } = getConnectionOptions();

      return mongoDb;
    }
  });
});
