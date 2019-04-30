'use strict';

const cloneDeep = require('lodash/cloneDeep');

const extendEntries = function ({ entries }) {
  if (!entries) {
    throw new Error('Entries are missing.');
  }

  const extendedEntries = cloneDeep(entries);

  for (const [ contextName, contextDefinition ] of Object.entries(extendedEntries.server.domain)) {
    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      for (const commandName of Object.keys(aggregateDefinition.commands)) {
        const eventNameFailed = `${commandName}Failed`;
        const eventNameRejected = `${commandName}Rejected`;

        if (aggregateDefinition.events[eventNameFailed]) {
          throw new Error(`Reserved event name '${eventNameFailed}' used in server/domain/${contextName}/${aggregateName}.`);
        }
        if (aggregateDefinition.events[eventNameRejected]) {
          throw new Error(`Reserved event name '${eventNameRejected}' used in server/domain/${contextName}/${aggregateName}.`);
        }

        aggregateDefinition.events[eventNameFailed] = {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string' }
            },
            required: [ 'reason' ],
            additionalProperties: false
          },

          handle () {
            // Intentionally left blank.
          },

          isAuthorized (aggregateInstance, event, { client }) {
            return event.initiator.id === client.user.id;
          }
        };

        aggregateDefinition.events[eventNameRejected] = {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string' }
            },
            required: [ 'reason' ],
            additionalProperties: false
          },

          handle () {
            // Intentionally left blank.
          },

          isAuthorized (aggregateInstance, event, { client }) {
            return event.initiator.id === client.user.id;
          }
        };
      }
    }
  }

  return extendedEntries;
};

module.exports = extendEntries;
