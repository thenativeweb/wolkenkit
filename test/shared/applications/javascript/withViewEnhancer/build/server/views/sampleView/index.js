'use strict';

const { all } = require('./queries/all');
const { Readable } = require('stream');

const sampleView = {
  queryHandlers: {
    all
  },
  notificationSubscribers: {},

  enhancers: [
    view => ({
      ...view,
      queryHandlers: {
        ...view.queryHandlers,
        enhancedQuery: {
          async handle () {
            return Readable.from([]);
          },

          isAuthorized () {
            return true;
          }
        }
      }
    })
  ]
};

module.exports = sampleView;
