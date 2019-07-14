'use strict';

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { MongoDb } = require('../../../../stores/lockstore');

suite('MongoDb', () => {
  getTestsFor({
    Lockstore: MongoDb,
    type: 'MongoDb',

    getOptions () {
      const { mongoDb } = getConnectionOptions();

      // This is MongoDb hard limit for an index entry.
      return { ...mongoDb, maxLockSize: 968 };
    }
  });
});
