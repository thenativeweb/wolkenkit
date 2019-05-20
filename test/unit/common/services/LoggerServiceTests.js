'use strict';

const assert = require('assertthat'),
      record = require('record-stdstreams');

const { LoggerService } = require('../../../../common/services');

suite('LoggerService', () => {
  test('is a function.', async () => {
    assert.that(LoggerService).is.ofType('function');
  });

  test('throws an error if file name is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new LoggerService({});
      /* eslint-enable no-new */
    }).is.throwing('File name is missing.');
  });

  test('provides logger functions.', async () => {
    const loggerService = new LoggerService({ fileName: '/foo/bar.js' });

    assert.that(loggerService.fatal).is.ofType('function');
    assert.that(loggerService.error).is.ofType('function');
    assert.that(loggerService.warn).is.ofType('function');
    assert.that(loggerService.info).is.ofType('function');
    assert.that(loggerService.debug).is.ofType('function');
  });

  test('logs with the provided file name.', async () => {
    const loggerService = new LoggerService({ fileName: '/foo/bar.js' });
    const stop = record();

    loggerService.info('Some log message...');

    const { stdout } = stop();
    const logMessage = JSON.parse(stdout);

    assert.that(logMessage.source.endsWith('/foo/bar.js')).is.true();
  });
});
