import { assert } from 'assertthat';
import { getLoggerService } from '../../../../lib/common/services/getLoggerService';
import path from 'path';
import { record } from 'record-stdstreams';

suite('getLoggerService', (): void => {
  suite('LoggerService', (): void => {
    test('provides logger functions.', async (): Promise<void> => {
      const loggerService = getLoggerService({
        fileName: __filename,
        packageManifest: { name: 'app', version: '1.0' }
      });

      /* eslint-disable @typescript-eslint/unbound-method */
      assert.that(loggerService.fatal).is.ofType('function');
      assert.that(loggerService.error).is.ofType('function');
      assert.that(loggerService.warn).is.ofType('function');
      assert.that(loggerService.info).is.ofType('function');
      assert.that(loggerService.debug).is.ofType('function');
      /* eslint-enable @typescript-eslint/unbound-method */
    });

    test('logs with the provided module and file name.', async (): Promise<void> => {
      const loggerService = getLoggerService({
        fileName: __filename,
        packageManifest: { name: 'app', version: '1.0' }
      });

      const stop = record(false);

      loggerService.info('Some log message...');

      const { stdout } = stop();
      const logMessage = JSON.parse(stdout);

      assert.that(logMessage.module).is.equalTo({
        name: 'app',
        version: '1.0'
      });
      assert.that(path.basename(logMessage.source)).is.equalTo('getLoggerServiceTests.ts');
    });
  });
});
