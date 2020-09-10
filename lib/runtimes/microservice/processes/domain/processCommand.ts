import { acknowledgeCommand } from './acknowledgeCommand';
import { CommandDispatcher } from './CommandDispatcher';
import { errors } from '../../../../common/errors';
import { fetchCommand } from './fetchCommand';
import { flaschenpost } from 'flaschenpost';
import { getCommandWithMetadataSchema } from '../../../../common/schemas/getCommandWithMetadataSchema';
import { keepRenewingLock } from './keepRenewingLock';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../common/domain/Repository';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const processCommand = async function ({
  commandDispatcher,
  repository,
  publishDomainEvents
}: {
  commandDispatcher: CommandDispatcher;
  repository: Repository;
  publishDomainEvents: PublishDomainEvents;
}): Promise<void> {
  const { command, metadata } = await fetchCommand({ commandDispatcher });

  logger.debug(
    'Fetched and locked command for domain server.',
    withLogMetadata(
      'runtime',
      'microservice/domain',
      { itemIdentifier: command.getItemIdentifier(), metadata }
    )
  );

  try {
    try {
      new Value(getCommandWithMetadataSchema()).validate(command, { valueName: 'command' });
    } catch (ex: unknown) {
      throw new errors.CommandMalformed((ex as Error).message);
    }

    const aggregateInstance = await repository.getAggregateInstance({
      aggregateIdentifier: command.aggregateIdentifier
    });

    const handleCommandPromise = aggregateInstance.handleCommand({ command });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ command, handleCommandPromise, commandDispatcher, token: metadata.token });
    })();

    const domainEvents = await handleCommandPromise;

    await publishDomainEvents({ domainEvents });
  } catch (ex: unknown) {
    logger.error(
      'Failed to handle command.',
      withLogMetadata('runtime', 'microservice/domain', { command, err: ex })
    );
  } finally {
    await acknowledgeCommand({ command, token: metadata.token, commandDispatcher });

    logger.debug(
      'Processed and acknowledged command.',
      withLogMetadata(
        'runtime',
        'microservice/domain',
        { itemIdentifier: command.getItemIdentifier(), metadata }
      )
    );
  }
};

export { processCommand };
