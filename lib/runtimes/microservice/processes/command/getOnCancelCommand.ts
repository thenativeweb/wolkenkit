import { CommandDispatcher } from './CommandDispatcher';
import { flaschenpost } from 'flaschenpost';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getOnCancelCommand = function ({ commandDispatcher }: {
  commandDispatcher: CommandDispatcher;
}): OnCancelCommand {
  return async function ({ commandIdentifierWithClient }): Promise<void> {
    try {
      logger.debug(
        'Cancelling command in command dispatcher...',
        withLogMetadata(
          'runtime',
          'microservice/command',
          { commandIdentifierWithClient }
        )
      );

      await commandDispatcher.client.cancelCommand({ commandIdentifierWithClient });

      logger.debug(
        'Cancelled command in command dispatcher.',
        withLogMetadata(
          'runtime',
          'microservice/command',
          { commandIdentifierWithClient }
        )
      );
    } catch (ex: unknown) {
      logger.error(
        'Failed to cancel command in command dispatcher.',
        withLogMetadata(
          'runtime',
          'microservice/command',
          { commandIdentifierWithClient, error: ex }
        )
      );

      throw new errors.RequestFailed({
        message: 'Failed to cancel command in command dispatcher.',
        cause: ex as Error,
        data: { commandIdentifierWithClient }
      });
    }
  };
};

export { getOnCancelCommand };
