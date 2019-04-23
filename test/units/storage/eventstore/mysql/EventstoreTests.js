'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/mysql/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('[storage/eventstore] mysql/Eventstore', () => {
  getTestsFor(Eventstore, {
    url: connectionStrings.mysql.unitTests,

    async startContainer () {
      shell.exec('docker start mysql-units');
      await waitFor.mysql({ url: connectionStrings.mysql.unitTests });
    },

    async stopContainer () {
      shell.exec('docker kill mysql-units');
    }
  });
});
