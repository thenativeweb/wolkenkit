'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/mysql/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('mysql/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'mysql',
    url: connectionStrings.mysql.integrationTests,

    async startContainer () {
      shell.exec('docker start mysql-integration');
      await waitFor.mysql({ url: connectionStrings.mysql.integrationTests });
    },

    async stopContainer () {
      shell.exec('docker kill mysql-integration');
    }
  });
});
