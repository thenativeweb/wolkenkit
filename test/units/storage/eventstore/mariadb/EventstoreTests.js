'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/mariadb/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('[storage/eventstore] mariadb/Eventstore', () => {
  getTestsFor(Eventstore, {
    url: connectionStrings.mariadb.unitTests,

    async startContainer () {
      shell.exec('docker start mariadb-units');
      await waitFor.mariadb({ url: connectionStrings.mariadb.unitTests });
    },

    async stopContainer () {
      shell.exec('docker kill mariadb-units');
    }
  });
});
