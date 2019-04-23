'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/mongodb/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('[storage/eventstore] mongodb/Eventstore', () => {
  getTestsFor(Eventstore, {
    url: connectionStrings.mongodb.unitTests,

    async startContainer () {
      shell.exec('docker start mongodb-units');
      await waitFor.mongodb({ url: connectionStrings.mongodb.unitTests });
    },

    async stopContainer () {
      shell.exec('docker kill mongodb-units');
    }
  });
});
