'use strict';

const Eventstore = require('../../../../../storage/eventstore/mariadb/Eventstore'),
      getTestsFor = require('../getTestsFor');

suite('mariadb/Eventstore', () => {
  getTestsFor(Eventstore, {
    type: 'mariadb'
  });
});
