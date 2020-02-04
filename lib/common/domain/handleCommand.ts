import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { getAggregateService } from '../services/getAggregateService';
import { getAggregatesService } from '../services/getAggregatesService';
import { getClientService } from '../services/getClientService';
import { getLoggerService } from '../services/getLoggerService';
import { PublishDomainEvents } from './PublishDomainEvents';
import { Repository } from './Repository';
import { State } from '../elements/State';
import { validateCommandWithMetadata } from '../validators/validateCommandWithMetadata';

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

  let domainEvents: DomainEventWithState<DomainEventData, State>[];

  try {
    const { handle } = applicationDefinition.domain[command.contextIdentifier.name][command.aggregateIdentifier.name].commandHandlers[command.name];

    await handle(currentAggregateState.state, command, services);

    domainEvents = await repository.saveCurrentAggregateState({ currentAggregateState });
  } catch (ex) {
    services.aggregate.publishDomainEvent(`${command.name}Failed`, {
      reason: ex.message
    });

    domainEvents = [
      currentAggregateState.unsavedDomainEvents[currentAggregateState.unsavedDomainEvents.length - 1]
    ];
  }

  await publishDomainEvents({ domainEvents });
};

export { handleCommand };
