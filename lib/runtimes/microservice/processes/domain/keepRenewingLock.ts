import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { getPromiseStatus } from '../../../../common/utils/getPromiseStatus';
import { sleep } from '../../../../common/utils/sleep';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const keepRenewingLock = async function ({ command, handleCommandPromise, commandDispatcher, token }: {
  command: CommandWithMetadata<CommandData>;
  handleCommandPromise: Promise<any>;
  commandDispatcher: CommandDispatcher;
  token: string;
}): Promise<void> {
  logger.debug(
    'Starting renew lock loop...',
    withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token }})
  );

  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    await sleep({ ms: commandDispatcher.renewalInterval });

    if (await getPromiseStatus(handleCommandPromise) !== 'pending') {
      logger.debug(
        'Stopped renew lock loop.',
        withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token }})
      );
      break;
    }

    await commandDispatcher.client.renewLock({
      discriminator: command.aggregateIdentifier.aggregate.id,
      token
    });

    logger.debug(
      'Renewed lock on command.',
      withLogMetadata(
        'runtime',
        'microservice/domain',
        { command, metadata: { token }}
      )
    );
  }
};

export { keepRenewingLock };
