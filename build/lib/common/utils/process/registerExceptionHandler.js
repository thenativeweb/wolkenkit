"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerExceptionHandler = void 0;
const flaschenpost_1 = require("flaschenpost");
const withLogMetadata_1 = require("../logging/withLogMetadata");
const logger = flaschenpost_1.flaschenpost.getLogger();
const handleUncaughtException = function (ex) {
    logger.fatal('Unexpected exception occured.', withLogMetadata_1.withLogMetadata('common', 'registerExceptionHandler', { reason: ex.message, error: ex }));
    /* eslint-disable unicorn/no-process-exit */
    process.exit(1);
    /* eslint-enable unicorn/no-process-exit */
};
const handleUnhandledRejection = function (reason, promise) {
    logger.fatal('Unexpected exception occured.', withLogMetadata_1.withLogMetadata('common', 'registerExceptionHandler', { reason, error: promise }));
    /* eslint-disable unicorn/no-process-exit */
    process.exit(1);
    /* eslint-enable unicorn/no-process-exit */
};
const registerExceptionHandler = function () {
    process.on('uncaughtException', handleUncaughtException);
    process.on('unhandledRejection', handleUnhandledRejection);
};
exports.registerExceptionHandler = registerExceptionHandler;
//# sourceMappingURL=registerExceptionHandler.js.map