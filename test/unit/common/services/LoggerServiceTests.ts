import assert from 'assertthat';
import getLoggerService from '../../../../lib/common/services/getLoggerService';
import record from 'record-stdstreams';

suite('LoggerService', (): void => {
  test('provides logger functions.', async (): Promise<void> => {
    const loggerService = getLoggerService({ fileName: __filename });

    /* eslint-disable @typescript-eslint/unbound-method */
    assert.that(loggerService.fatal).is.ofType('function');
    assert.that(loggerService.error).is.ofType('function');
    assert.that(loggerService.warn).is.ofType('function');
    assert.that(loggerService.info).is.ofType('function');
    assert.that(loggerService.debug).is.ofType('function');
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  test('logs with the provided file name.', async (): Promise<void> => {
    const loggerService = getLoggerService({ fileName: __filename });
    const stop = record(false);

    loggerService.info('Some log message...');

    const { stdout } = stop();
    const logMessage = JSON.parse(stdout);

    assert.that(logMessage.source.endsWith('/LoggerServiceTests.ts')).is.true();
  });
});
