import { flaschenpost } from 'flaschenpost';
import { withLogMetadata } from '../logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const handleUncaughtException = function (ex: Error): void {
  logger.fatal(
    'Unexpected exception occured.',
    withLogMetadata('common', 'registerExceptionHandler', { reason: ex.message, error: ex })
  );

  /* eslint-disable unicorn/no-process-exit */
  process.exit(1);
  /* eslint-enable unicorn/no-process-exit */
};

const handleUnhandledRejection = function (
  reason: any,
  promise: Promise<any>
): void {
  logger.fatal(
    'Unexpected exception occured.',
    withLogMetadata('common', 'registerExceptionHandler', { reason, error: promise })
  );

  /* eslint-disable unicorn/no-process-exit */
  process.exit(1);
  /* eslint-enable unicorn/no-process-exit */
};

const registerExceptionHandler = function (): void {
  process.on('uncaughtException', handleUncaughtException);
  process.on('unhandledRejection', handleUnhandledRejection);
};

export { registerExceptionHandler };
