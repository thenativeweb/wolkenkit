'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/postgres/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('[storage/eventstore] postgres/Eventstore', () => {
  getTestsFor(Eventstore, {
    url: connectionStrings.postgres.unitTests,

    async startContainer () {
      shell.exec('docker start postgres-units');
      await waitFor.postgres({ url: connectionStrings.postgres.unitTests });
    },

    async stopContainer () {
      shell.exec('docker kill postgres-units');
    }
  });
});
