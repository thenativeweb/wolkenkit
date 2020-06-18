import { Dispatcher } from './Dispatcher';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';

const logger = flaschenpost.getLogger();

const getOnCancelCommand = function ({ dispatcher }: {
  dispatcher: Dispatcher;
}): OnCancelCommand {
  return async function ({ commandIdentifierWithClient }): Promise<void> {
    try {
      await dispatcher.client.cancelCommand({ commandIdentifierWithClient });

      logger.info('Cancelled command in dispatcher.', { commandIdentifierWithClient });
    } catch (ex) {
      logger.error('Failed to cancel command in dispatcher.', { commandIdentifierWithClient, ex });

      throw new errors.RequestFailed('Failed to cancel command in dispatcher.', {
        cause: ex,
        data: { commandIdentifierWithClient }
      });
    }
  };
};

export { getOnCancelCommand };
