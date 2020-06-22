import { Application } from '../common/application/Application';
import { ApplicationEnhancer } from './ApplicationEnhancer';
import { AskInfrastructure } from '../common/elements/AskInfrastructure';
import { cloneDeep } from 'lodash';
import { DomainEventData } from '../common/elements/DomainEventData';
import { DomainEventHandler } from '../common/elements/DomainEventHandler';
import { errors } from '../common/errors';
import { Schema } from '../common/elements/Schema';
import { State } from '../common/elements/State';
import { TellInfrastructure } from '../common/elements/TellInfrastructure';

const withSystemDomainEvents: ApplicationEnhancer = (application): Application => {
  const clonedApplication = cloneDeep(application);

  for (const [ contextName, contextDefinition ] of Object.entries(clonedApplication.domain)) {
    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      for (const commandName of Object.keys(aggregateDefinition.commandHandlers)) {
        const domainEventNameFailed = `${commandName}Failed`;
        const domainEventNameRejected = `${commandName}Rejected`;

        if (domainEventNameFailed in clonedApplication.domain[contextName][aggregateName].domainEventHandlers) {
          throw new errors.DomainEventAlreadyExists(`Reserved domain event name '${domainEventNameFailed}' used in '<app>/server/domain/${contextName}/${aggregateName}/'.`);
        }

        if (domainEventNameRejected in clonedApplication.domain[contextName][aggregateName].domainEventHandlers) {
          throw new errors.DomainEventAlreadyExists(`Reserved domain event name '${domainEventNameRejected}' used in '<app>/server/domain/${contextName}/${aggregateName}/'.`);
        }

        const domainEventHandler: DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure> = {
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

        clonedApplication.domain[contextName][aggregateName].domainEventHandlers[domainEventNameFailed] = domainEventHandler;
        clonedApplication.domain[contextName][aggregateName].domainEventHandlers[domainEventNameRejected] = domainEventHandler;
      }
    }
  }

  return clonedApplication;
};

export { withSystemDomainEvents };
