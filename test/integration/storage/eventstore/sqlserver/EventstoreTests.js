'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/sqlserver/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('sqlserver/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'sqlserver',
    url: connectionStrings.sqlServer.integrationTests,

    async startContainer () {
      shell.exec('docker start sqlserver-integration');
      await waitFor.sqlServer({ url: connectionStrings.sqlServer.integrationTests });
    },

    async stopContainer () {
      shell.exec('docker kill sqlserver-integration');
    }
  });
});
