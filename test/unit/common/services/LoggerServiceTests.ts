import assert from 'assertthat';
import getLoggerService from '../../../../src/common/services/getLoggerService';
import record from 'record-stdstreams';

suite('LoggerService', (): void => {
  test('provides logger functions.', async (): Promise<void> => {
    const loggerService = getLoggerService({ fileName: '/foo/bar.js' });

    assert.that(loggerService.fatal).is.ofType('function');
    assert.that(loggerService.error).is.ofType('function');
    assert.that(loggerService.warn).is.ofType('function');
    assert.that(loggerService.info).is.ofType('function');
    assert.that(loggerService.debug).is.ofType('function');
  });

  test('logs with the provided file name.', async (): Promise<void> => {
    const loggerService = getLoggerService({ fileName: '/foo/bar.js' });
    const stop = record();

    loggerService.info('Some log message...');

    const { stdout } = stop();
    const logMessage = JSON.parse(stdout);

    assert.that(logMessage.source.endsWith('/foo/bar.js')).is.true();
  });
});
