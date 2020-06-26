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
  const { command, token } = await fetchCommand({ commandDispatcher });

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
      await keepRenewingLock({ command, handleCommandPromise, commandDispatcher, token });
    })();

    const domainEvents = await handleCommandPromise;

    await publishDomainEvents({ domainEvents });
  } catch (ex) {
    logger.error('Failed to handle command.', { command, ex });
  } finally {
    await acknowledgeCommand({ command, token, commandDispatcher });
  }
};

export { processCommand };
