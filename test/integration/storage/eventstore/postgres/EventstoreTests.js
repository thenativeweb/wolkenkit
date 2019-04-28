'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/postgres/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('postgres/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'postgres',
    url: connectionStrings.postgres.integrationTests,

    async startContainer () {
      shell.exec('docker start postgres-integration');
      await waitFor.postgres({ url: connectionStrings.postgres.integrationTests });
    },

    async stopContainer () {
      shell.exec('docker kill postgres-integration');
    }
  });
});
