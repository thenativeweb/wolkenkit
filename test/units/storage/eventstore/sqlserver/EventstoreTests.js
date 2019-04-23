'use strict';

const shell = require('shelljs');

const connectionStrings = require('../../../../shared/connectionStrings'),
      Eventstore = require('../../../../../storage/eventstore/sqlserver/Eventstore'),
      getTestsFor = require('../getTestsFor'),
      waitFor = require('../../../../shared/waitFor');

suite('[storage/eventstore] sqlserver/Eventstore', () => {
  getTestsFor(Eventstore, {
    url: connectionStrings.sqlServer.unitTests,

    async startContainer () {
      shell.exec('docker start sqlserver-units');
      await waitFor.sqlServer({ url: connectionStrings.sqlServer.unitTests });
    },

    async stopContainer () {
      shell.exec('docker kill sqlserver-units');
    }
  });
});
