import { ApplicationDefinition } from '../common/application/ApplicationDefinition';
import { ApplicationEnhancer } from './ApplicationEnhancer';
import { cloneDeep } from 'lodash';
import { DomainEventData } from '../common/elements/DomainEventData';
import { DomainEventHandler } from '../common/elements/DomainEventHandler';
import { errors } from '../common/errors';
import { Schema } from '../common/elements/Schema';
import { State } from '../common/elements/State';

const withSystemDomainEvents: ApplicationEnhancer = (applicationDefinition): ApplicationDefinition => {
  const clonedApplicationDefinition = cloneDeep(applicationDefinition);

  for (const [ contextName, contextDefinition ] of Object.entries(clonedApplicationDefinition.domain)) {
    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      for (const commandName of Object.keys(aggregateDefinition.commandHandlers)) {
        const domainEventNameFailed = `${commandName}Failed`;
        const domainEventNameRejected = `${commandName}Rejected`;

        if (domainEventNameFailed in clonedApplicationDefinition.domain[contextName][aggregateName].domainEventHandlers) {
          throw new errors.DomainEventAlreadyExists(`Reserved domain event name '${domainEventNameFailed}' used in '<app>/server/domain/${contextName}/${aggregateName}/'.`);
        }

        if (domainEventNameRejected in clonedApplicationDefinition.domain[contextName][aggregateName].domainEventHandlers) {
          throw new errors.DomainEventAlreadyExists(`Reserved domain event name '${domainEventNameRejected}' used in '<app>/server/domain/${contextName}/${aggregateName}/'.`);
        }

        const domainEventHandler: DomainEventHandler<State, DomainEventData> = {
          getSchema (): Schema {
            return {
              type: 'object',
              properties: {
                reason: { type: 'string' }
              },
              required: [ 'reason' ],
              additionalProperties: false
            };
          },

          handle (state): Partial<State> {
            return state;
          },

          isAuthorized (_state, domainEvent, { client }): boolean {
            return domainEvent.metadata.initiator.user.id === client.user.id;
          }
        };

        clonedApplicationDefinition.domain[contextName][aggregateName].domainEventHandlers[domainEventNameFailed] = domainEventHandler;
        clonedApplicationDefinition.domain[contextName][aggregateName].domainEventHandlers[domainEventNameRejected] = domainEventHandler;
      }
    }
  }

  return clonedApplicationDefinition;
};

export { withSystemDomainEvents };
