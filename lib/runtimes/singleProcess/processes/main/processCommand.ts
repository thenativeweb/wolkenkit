import { acknowledgeCommand } from './acknowledgeCommand';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { errors } from '../../../../common/errors';
import { fetchCommand } from './fetchCommand';
import { flaschenpost } from 'flaschenpost';
import { getCommandWithMetadataSchema } from '../../../../common/schemas/getCommandWithMetadataSchema';
import { keepRenewingLock } from './keepRenewingLock';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { PriorityQueue } from './PriorityQueue';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../common/domain/Repository';
import { Value } from 'validate-value';

const logger = flaschenpost.getLogger();

const processCommand = async function ({ repository, priorityQueue, publishDomainEvents }: {
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  lockStore: LockStore;
  priorityQueue: PriorityQueue;
  publishDomainEvents: PublishDomainEvents;
}): Promise<void> {
  const { command, token } = await fetchCommand({ priorityQueue });

  try {
    try {
      new Value(getCommandWithMetadataSchema()).validate(command, { valueName: 'command' });
    } catch (ex) {
      throw new errors.CommandMalformed(ex.message);
    }

    const aggregateInstance = await repository.getAggregateInstance({
      contextIdentifier: command.contextIdentifier,
      aggregateIdentifier: command.aggregateIdentifier
    });

    const handleCommandPromise = aggregateInstance.handleCommand({ command });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ command, handleCommandPromise, priorityQueue, token });
    })();

    const domainEvents = await handleCommandPromise;

    await publishDomainEvents({ domainEvents });
  } catch (ex) {
    logger.error('Failed to handle command.', { command, ex });
  } finally {
    await acknowledgeCommand({ command, token, priorityQueue });
  }
};

export { processCommand };
