import { CommandDispatcher } from './CommandDispatcher';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { retry } from 'retry-ignore-abort';

const logger = flaschenpost.getLogger();

const getOnReceiveCommand = function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): OnReceiveCommand {
  return async function ({ command }): Promise<void> {
    try {
      await retry(async (): Promise<void> => {
        await commandDispatcher.client.postCommand({ command });
      }, { retries: commandDispatcher.retries, maxTimeout: 1_000 });

      logger.info('Command sent to command dispatcher.', { command });
    } catch (ex: unknown) {
      logger.error('Failed to send command to command dispatcher.', { command, error: ex });

      throw new errors.RequestFailed('Failed to send command to command dispatcher.', {
        cause: ex as Error,
        data: { command }
      });
    }
  };
};

export { getOnReceiveCommand };
