'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/mongodb/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('mongodb/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'mongodb',
    url: connectionStrings.mongodb.integrationTests,

    async startContainer () {
      shell.exec('docker start mongodb-integration');
      await waitFor.mongodb({ url: connectionStrings.mongodb.integrationTests });
    },

    async stopContainer () {
      shell.exec('docker kill mongodb-integration');
    }
  });
});
