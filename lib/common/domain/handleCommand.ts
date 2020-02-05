import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { cloneDeep } from 'lodash';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from 'lib/common/errors';
import { getAggregateService } from '../services/getAggregateService';
import { getAggregatesService } from '../services/getAggregatesService';
import { getClientService } from '../services/getClientService';
import { getLoggerService } from '../services/getLoggerService';
import { PublishDomainEvents } from './PublishDomainEvents';
import { Repository } from './Repository';
import { State } from '../elements/State';
import { validateCommandWithMetadata } from '../validators/validateCommandWithMetadata';
import { Value } from 'validate-value';

const handleCommand = async function ({
  command,
  applicationDefinition,
  repository,
  publishDomainEvents
}: {
  command: CommandWithMetadata<CommandData>;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  publishDomainEvents: PublishDomainEvents;
}): Promise<void> {
  validateCommandWithMetadata({ command, applicationDefinition });

  const currentAggregateState = await repository.loadCurrentAggregateState({
    contextIdentifier: command.contextIdentifier,
    aggregateIdentifier: command.aggregateIdentifier
  });

  const services = {
    aggregate: getAggregateService({ applicationDefinition, command, currentAggregateState }),
    aggregates: getAggregatesService({ applicationDefinition, repository }),
    client: getClientService({ clientMetadata: command.metadata.client }),
    logger: getLoggerService({
      fileName: `<app>/server/domain/${command.contextIdentifier.name}/${command.aggregateIdentifier.name}/`,
      packageManifest: applicationDefinition.packageManifest
    })
  };

  const commandHandler = applicationDefinition.domain[command.contextIdentifier.name][command.aggregateIdentifier.name].commandHandlers[command.name];

  let domainEvents: DomainEventWithState<DomainEventData, State>[];

  try {
    if (commandHandler.getSchema) {
      const schema = commandHandler.getSchema();
      const value = new Value(schema);

      value.validate(command.data, { valueName: 'data', separator: '.' });
    }

    const clonedCommand = cloneDeep(command);

    const isAuthorized = await commandHandler.isAuthorized(currentAggregateState, clonedCommand, services);

    if (!isAuthorized) {
      throw new errors.CommandNotAuthorized();
    }

    await commandHandler.handle(currentAggregateState.state, clonedCommand, services);

    domainEvents = await repository.saveCurrentAggregateState({ currentAggregateState });
  } catch (ex) {
    if (ex.code === 'ECOMMANDNOTAUTHORIZED') {
      services.aggregate.publishDomainEvent(`${command.name}Rejected`, {
        reason: ex.message
      });
    } else {
      services.aggregate.publishDomainEvent(`${command.name}Failed`, {
        reason: ex.message
      });
    }

    domainEvents = [
      currentAggregateState.unsavedDomainEvents[currentAggregateState.unsavedDomainEvents.length - 1]
    ];
  }

  await publishDomainEvents({ domainEvents });
};

export { handleCommand };
