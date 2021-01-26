'use strict';

const { all } = require('./queries/all');
const { first } = require('./queries/first');
const { notFound } = require('./queries/notFound');
const { streamAuthorized } = require('./queries/streamAuthorized');
const { streamWithOptions } = require('./queries/streamWithOptions');
const { valueAuthorized } = require('./queries/valueAuthorized');
const { valueWithOptions } = require('./queries/valueWithOptions');

const sampleView = {
  queryHandlers: {
    all,
    first,
    notFound,
    streamAuthorized,
    streamWithOptions,
    valueAuthorized,
    valueWithOptions
  },
  notificationSubscribers: {}
};

module.exports = sampleView;
