'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/mariadb/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('mariadb/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'mariadb',
    url: connectionStrings.mariadb.integrationTests,

    async startContainer () {
      shell.exec('docker start mariadb-integration');
      await waitFor.mariadb({ url: connectionStrings.mariadb.integrationTests });
    },

    async stopContainer () {
      shell.exec('docker kill mariadb-integration');
    }
  });
});
