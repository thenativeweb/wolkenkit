"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getLoggerService_1 = require("../../../../lib/common/services/getLoggerService");
const path_1 = __importDefault(require("path"));
const record_stdstreams_1 = require("record-stdstreams");
suite('getLoggerService', () => {
    suite('LoggerService', () => {
        test('provides logger functions.', async () => {
            const loggerService = getLoggerService_1.getLoggerService({
                fileName: __filename,
                packageManifest: { name: 'app', version: '1.0' }
            });
            /* eslint-disable @typescript-eslint/unbound-method */
            assertthat_1.assert.that(loggerService.fatal).is.ofType('function');
            assertthat_1.assert.that(loggerService.error).is.ofType('function');
            assertthat_1.assert.that(loggerService.warn).is.ofType('function');
            assertthat_1.assert.that(loggerService.info).is.ofType('function');
            assertthat_1.assert.that(loggerService.debug).is.ofType('function');
            /* eslint-enable @typescript-eslint/unbound-method */
        });
        test('logs with the provided module and file name.', async () => {
            const loggerService = getLoggerService_1.getLoggerService({
                fileName: __filename,
                packageManifest: { name: 'app', version: '1.0' }
            });
            const stop = record_stdstreams_1.record(false);
            loggerService.info('Some log message...');
            const { stdout } = stop();
            const logMessage = JSON.parse(stdout);
            assertthat_1.assert.that(logMessage.module).is.equalTo({
                name: 'app',
                version: '1.0'
            });
            assertthat_1.assert.that(path_1.default.basename(logMessage.source)).is.equalTo('getLoggerServiceTests.ts');
        });
    });
});
//# sourceMappingURL=getLoggerServiceTests.js.map