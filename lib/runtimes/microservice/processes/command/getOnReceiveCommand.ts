import { Dispatcher } from './Dispatcher';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { retry } from 'retry-ignore-abort';

const logger = flaschenpost.getLogger();

const getOnReceiveCommand = function ({ dispatcher }: {
  dispatcher: Dispatcher;
}): OnReceiveCommand {
  return async function ({ command }): Promise<void> {
    try {
      await retry(async (): Promise<void> => {
        await dispatcher.client.postCommand({ command });
      }, { retries: dispatcher.retries, maxTimeout: 1000 });

      logger.info('Command sent to dispatcher server.', { command });
    } catch (ex) {
      logger.error('Failed to send command to dispatcher.', { command, ex });

      throw new errors.RequestFailed('Failed to send command to dispatcher.', {
        cause: ex,
        data: { command }
      });
    }
  };
};

export { getOnReceiveCommand };
