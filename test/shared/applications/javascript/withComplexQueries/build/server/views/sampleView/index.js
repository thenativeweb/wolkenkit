'use strict';

const { all } = require('./queries/all');
const { first } = require('./queries/first');
const { firstTwo } = require('./queries/firstTwo');
const { flowSampleFlowUpdatedNotificationSubscriber } = require('./notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber');
const { notFound } = require('./queries/notFound');
const { streamAuthorized } = require('./queries/streamAuthorized');
const { streamUnauthorized } = require('./queries/streamUnauthorized');
const { streamWithOptions } = require('./queries/streamWithOptions');
const { valueAuthorized } = require('./queries/valueAuthorized');
const { valueUnauthorized } = require('./queries/valueUnauthorized');
const { valueWithOptions } = require('./queries/valueWithOptions');

const sampleView = {
  queryHandlers: {
    all,
    first,
    firstTwo,
    notFound,
    streamAuthorized,
    streamUnauthorized,
    streamWithOptions,
    valueAuthorized,
    valueUnauthorized,
    valueWithOptions
  },
  notificationSubscribers: {
    flowSampleFlowUpdatedNotificationSubscriber
  }
};

module.exports = sampleView;
