'use strict';

const { all } = require('./queries/all');
const { authorized } = require('./queries/authorized');
const { first } = require('./queries/first');
const { withOptions } = require('./queries/withOptions');

const sampleView = {
  queryHandlers: {
    all,
    authorized,
    first,
    withOptions
  },
  notificationSubscribers: {}
};

module.exports = sampleView;
