import { acknowledgeCommand } from './acknowledgeCommand';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Dispatcher } from './Dispatcher';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { fetchCommand } from './fetchCommand';
import { flaschenpost } from 'flaschenpost';
import { handleCommand } from '../../../../common/domain/handleCommand';
import { keepRenewingLock } from './keepRenewingLock';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../common/domain/Repository';

const logger = flaschenpost.getLogger();

const processCommand = async function ({
  dispatcher,
  applicationDefinition,
  lockStore,
  domainEventStore,
  repository,
  publishDomainEvents
}: {
  dispatcher: Dispatcher;
  applicationDefinition: ApplicationDefinition;
  lockStore: LockStore;
  domainEventStore: DomainEventStore;
  repository: Repository;
  publishDomainEvents: PublishDomainEvents;
}): Promise<void> {
  const { command, token } = await fetchCommand({ dispatcher });

  if (await domainEventStore.hasDomainEventsWithCausationId({ causationId: command.id })) {
    // The command has already resulted in domain events and thus was processed
    // before and can be skipped.
    await acknowledgeCommand({ command, token, dispatcher });

    return;
  }

  try {
    const handleCommandPromise = handleCommand({
      command,
      applicationDefinition,
      lockStore,
      repository,
      publishDomainEvents
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ command, handleCommandPromise, dispatcher, token });
    })();

    await handleCommandPromise;
  } catch (ex) {
    logger.error('Failed to handle command.', { command, ex });
  } finally {
    await acknowledgeCommand({ command, token, dispatcher });
  }
};

export { processCommand };
