'use strict';

const { PassThrough } = require('stream');

const { all } = require('./queries/all'),
      { executed } = require('./projections/executed'),
      { initializer } = require('./initializer');

const sampleView = {
  initializer,
  projectionHandlers: {
    executed
  },
  queryHandlers: {
    all
  },
  enhancers: [
    aggregate => ({
      ...aggregate,
      projectionHandlers: {
        ...aggregate.projectionHandlers,
        enhancedProjection: {
          selector: 'sampleContext.sampleAggregate.executed',
          async handle () {
            // Intentionally left blank.
          }
        }
      },
      queryHandlers: {
        ...aggregate.queryHandlers,
        enhancedQuery: {
          async handle (sampleItems) {
            const stream = new PassThrough({ objectMode: true });

            for (const item of sampleItems) {
              stream.write(item);
            }
            stream.end();

            return stream;
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
