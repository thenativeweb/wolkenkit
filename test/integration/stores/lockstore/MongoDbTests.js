'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../stores/lockstore');

suite('MongoDb', () => {
  getTestsFor({
    Lockstore: MongoDb,

    getOptions () {
      const { mongoDb } = getConnectionOptions();

      return mongoDb;
    }
  });
});
