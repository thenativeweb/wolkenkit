import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { cloneDeep } from 'lodash';
import EventInternal from '../elements/EventInternal';
import { IApplicationConfiguration } from './types/IApplicationConfiguration';
import { IServices } from '../services/types/IServices';

const extendApplicationConfiguration = function ({ applicationConfiguration }: {
  applicationConfiguration: IApplicationConfiguration;
}): IApplicationConfiguration {
  const applicationConfigurationExtended = cloneDeep(applicationConfiguration);

  for (const [ contextName, contextConfiguration ] of Object.entries(applicationConfigurationExtended.domain)) {
    for (const [ aggregateName, aggregateConfiguration ] of Object.entries(contextConfiguration)) {
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

          isAuthorized (_: AggregateApiForReadOnly, event: EventInternal, { client }: IServices): boolean {
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

          isAuthorized (_: AggregateApiForReadOnly, event: EventInternal, { client }: IServices): boolean {
            return event.metadata.initiator.user.id === client.user.id;
          }
        };
      }
    }
  }

  return applicationConfigurationExtended;
};

export default extendApplicationConfiguration;
