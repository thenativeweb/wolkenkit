'use strict';

const { execute } = require('./commands/execute'),
      { executed } = require('./domainEvents/executed'),
      { succeeded } = require('./domainEvents/succeeded'),
      { getInitialState } = require('./SampleState');

const sampleAggregate = {
  getInitialState,
  commandHandlers: {
    execute
  },
  domainEventHandlers: {
    succeeded,
    executed
  },
  enhancers: [
    aggregate => ({
      ...aggregate,
      commandHandlers: {
        ...aggregate.commandHandlers,
        enhancedCommand: {
          isAuthorized () {
            return true;
          },
          handle () {
            // Intentionally left blank.
          }
        }
      },
      domainEventHandlers: {
        ...aggregate.domainEventHandlers,
        enhancedDomainEvent: {
          isAuthorized () {
            return true;
          },
          handle (state) {
            return state;
          }
        }
      }
    })
  ]
};

module.exports = sampleAggregate;
