import { acknowledgeCommand } from './acknowledgeCommand';
import { Application } from '../../../../../common/application/Application';
import { DomainPriorityQueue } from './DomainPriorityQueue';
import { fetchCommand } from './fetchCommand';
import { flaschenpost } from 'flaschenpost';
import { getCommandWithMetadataSchema } from '../../../../../common/schemas/getCommandWithMetadataSchema';
import { keepRenewingLock } from './keepRenewingLock';
import { LockStore } from '../../../../../stores/lockStore/LockStore';
import { Parser } from 'validate-value';
import { PublishDomainEvents } from '../../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../../common/domain/Repository';
import { withLogMetadata } from '../../../../../common/utils/logging/withLogMetadata';
import * as errors from '../../../../../common/errors';

const logger = flaschenpost.getLogger();

const commandWithMetadataParser = new Parser(getCommandWithMetadataSchema());

const processCommand = async function ({ repository, priorityQueue, publishDomainEvents }: {
  application: Application;
  repository: Repository;
  lockStore: LockStore;
  priorityQueue: DomainPriorityQueue;
  publishDomainEvents: PublishDomainEvents;
}): Promise<void> {
  const { command, metadata } = await fetchCommand({ priorityQueue });

  logger.debug(
    'Fetched and locked command for domain server.',
    withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: command.getItemIdentifier(), metadata })
  );

  try {
    commandWithMetadataParser.parse(
      command,
      { valueName: 'command' }
    ).unwrapOrThrow(
      (err): Error => new errors.CommandMalformed(err.message)
    );

    const aggregateInstance = await repository.getAggregateInstance({
      aggregateIdentifier: command.aggregateIdentifier
    });

    const handleCommandPromise = aggregateInstance.handleCommand({ command });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ command, handleCommandPromise, priorityQueue, token: metadata.token });
    })();

    const domainEvents = await handleCommandPromise;

    await publishDomainEvents({ domainEvents });
  } catch (ex: unknown) {
    logger.error(
      'Failed to handle command.',
      withLogMetadata('runtime', 'singleProcess/main', { command, error: ex })
    );
  } finally {
    await acknowledgeCommand({ command, token: metadata.token, priorityQueue });

    logger.debug(
      'Processed and acknowledged command.',
      withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: command.getItemIdentifier(), metadata })
    );
  }
};

export { processCommand };
