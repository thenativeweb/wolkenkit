import { acknowledgeCommand } from './acknowledgeCommand';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { fetchCommand } from './fetchCommand';
import { flaschenpost } from 'flaschenpost';
import { handleCommand } from '../../../../common/domain/handleCommand';
import { keepRenewingLock } from './keepRenewingLock';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { PriorityQueue } from './PriorityQueue';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../common/domain/Repository';
import { shouldRetryCommand } from '../../../../common/domain/shouldRetryCommand';

const logger = flaschenpost.getLogger();

const processCommand = async function ({ applicationDefinition, repository, lockStore, priorityQueue, publishDomainEvents }: {
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  lockStore: LockStore;
  priorityQueue: PriorityQueue;
  publishDomainEvents: PublishDomainEvents;
}): Promise<void> {
  const { command, token } = await fetchCommand({ priorityQueue });

  const retry = await shouldRetryCommand({ command, applicationDefinition });

  if (!retry) {
    await acknowledgeCommand({ command, token, defer: true, priorityQueue });
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
      await keepRenewingLock({ command, handleCommandPromise, priorityQueue, token });
    })();

    await handleCommandPromise;
  } catch (ex) {
    logger.error('Failed to handle command.', { command, ex });
  } finally {
    await acknowledgeCommand({ command, token, priorityQueue });
  }
};

export { processCommand };
