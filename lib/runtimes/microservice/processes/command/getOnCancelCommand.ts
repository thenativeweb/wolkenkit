import { CommandDispatcher } from './CommandDispatcher';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';

const logger = flaschenpost.getLogger();

const getOnCancelCommand = function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): OnCancelCommand {
  return async function ({ commandIdentifierWithClient }): Promise<void> {
    try {
      await commandDispatcher.client.cancelCommand({ commandIdentifierWithClient });

      logger.info('Cancelled command in command dispatcher.', { commandIdentifierWithClient });
    } catch (ex) {
      logger.error('Failed to cancel command in command dispatcher.', { commandIdentifierWithClient, ex });

      throw new errors.RequestFailed('Failed to cancel command in command dispatcher.', {
        cause: ex,
        data: { commandIdentifierWithClient }
      });
    }
  };
};

export { getOnCancelCommand };
