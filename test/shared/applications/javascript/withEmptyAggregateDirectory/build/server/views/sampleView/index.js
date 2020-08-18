'use strict';

const { all } = require('./queries/all');

const sampleView = {
  queryHandlers: {
    all
  },
  notificationSubscribers: {}
};

module.exports = sampleView;
