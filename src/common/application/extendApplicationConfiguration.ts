import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { ApplicationConfiguration } from './ApplicationConfiguration';
import { ClientService } from '../services/ClientService';
import { cloneDeep } from 'lodash';
import errors from '../errors';
import EventInternal from '../elements/EventInternal';

const extendApplicationConfiguration = function ({ applicationConfiguration }: {
  applicationConfiguration: ApplicationConfiguration;
}): ApplicationConfiguration {
  const applicationConfigurationExtended = cloneDeep(applicationConfiguration);

  for (const [ contextName, contextConfiguration ] of Object.entries(applicationConfigurationExtended.domain)) {
    if (!contextConfiguration) {
      throw new errors.InvalidOperation();
    }

    for (const [ aggregateName, aggregateConfiguration ] of Object.entries(contextConfiguration)) {
      if (!aggregateConfiguration) {
        throw new errors.InvalidOperation();
      }

      for (const commandName of Object.keys(aggregateConfiguration.commands)) {
        const eventNameFailed = `${commandName}Failed`;
        const eventNameRejected = `${commandName}Rejected`;

        if (aggregateConfiguration.events[eventNameFailed]) {
          throw new Error(`Reserved event name '${eventNameFailed}' used in server/domain/${contextName}/${aggregateName}.`);
        }
        if (aggregateConfiguration.events[eventNameRejected]) {
          throw new Error(`Reserved event name '${eventNameRejected}' used in server/domain/${contextName}/${aggregateName}.`);
        }

        aggregateConfiguration.events[eventNameFailed] = {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string' }
            },
            required: [ 'reason' ],
            additionalProperties: false
          },

          handle (): void {
            // Intentionally left blank.
          },

          isAuthorized (
            _: AggregateApiForReadOnly,
            event: EventInternal,
            { client }: {
              client: ClientService
            }
          ): boolean {
            return event.metadata.initiator.user.id === client.user.id;
          }
        };

        aggregateConfiguration.events[eventNameRejected] = {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string' }
            },
            required: [ 'reason' ],
            additionalProperties: false
          },

          handle (): void {
            // Intentionally left blank.
          },

          isAuthorized (
            _: AggregateApiForReadOnly,
            event: EventInternal,
            { client }: {
              client: ClientService
            }
          ): boolean {
            return event.metadata.initiator.user.id === client.user.id;
          }
        };
      }
    }
  }

  return applicationConfigurationExtended;
};

export default extendApplicationConfiguration;
