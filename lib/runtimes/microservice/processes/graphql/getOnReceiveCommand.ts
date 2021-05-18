import { CommandDispatcher } from './CommandDispatcher';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { retry } from 'retry-ignore-abort';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getOnReceiveCommand = function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): OnReceiveCommand {
  return async function ({ command }): Promise<void> {
    try {
      await retry(async (): Promise<void> => {
        await commandDispatcher.client.postCommand({ command });
      }, { retries: commandDispatcher.retries, maxTimeout: 1_000 });

      logger.debug(
        'Command sent to command dispatcher.',
        withLogMetadata('runtime', 'microservice/graphql', { command })
      );
    } catch (ex: unknown) {
      logger.error(
        'Failed to send command to command dispatcher.',
        withLogMetadata('runtime', 'microservice/graphql', { command, error: ex })
      );

      throw new errors.RequestFailed({
        message: 'Failed to send command to command dispatcher.',
        cause: ex as Error,
        data: { command }
      });
    }
  };
};

export { getOnReceiveCommand };
