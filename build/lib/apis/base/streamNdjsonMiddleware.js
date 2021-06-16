"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamNdjsonMiddleware = void 0;
const flaschenpost_1 = require("flaschenpost");
const withLogMetadata_1 = require("../../common/utils/logging/withLogMetadata");
const writeLine_1 = require("./writeLine");
const logger = flaschenpost_1.flaschenpost.getLogger();
const heartbeat = { name: 'heartbeat' };
// The streamNdjson middleware initializes a long-lived connection with the
// content type `application/x-ndjson` and sends a periodic heartbeat every
// `heartbeatInterval` milliseconds.
const streamNdjsonMiddleware = async function (req, res, next) {
    // eslint-disable-next-line no-param-reassign
    res.startStream = function ({ heartbeatInterval }) {
        var _a;
        try {
            let heartbeatIntervalId;
            req.setTimeout(0, () => {
                // Intentionally left blank.
            });
            res.setTimeout(0);
            res.writeHead(200, { 'content-type': 'application/x-ndjson' });
            (_a = res.socket) === null || _a === void 0 ? void 0 : _a.once('close', () => {
                if (heartbeatInterval !== false) {
                    clearInterval(heartbeatIntervalId);
                }
            });
            if (heartbeatInterval !== false) {
                // Send an initial heartbeat to initialize the connection. If we do not do
                // this, sometimes the connection does not become open until the first data
                // is sent.
                writeLine_1.writeLine({ res, data: heartbeat });
                heartbeatIntervalId = setInterval(() => {
                    writeLine_1.writeLine({ res, data: heartbeat });
                }, heartbeatInterval);
            }
            return next();
        }
        catch (ex) {
            // It can happen that the connection gets closed in the background, and
            // hence the underlying socket does not have a remote address any more. We
            // can't detect this using an if statement, because connection handling is
            // done by Node.js in a background thread, and we may have a race
            // condition here. So, we decided to actively catch this exception, and
            // take it as an indicator that the connection has been closed meanwhile.
            if (ex instanceof Error && ex.message === 'Remote address is missing.') {
                return;
            }
            logger.error('An unexpected error occured.', withLogMetadata_1.withLogMetadata('api', 'base', { error: ex }));
            throw ex;
        }
    };
    next();
};
exports.streamNdjsonMiddleware = streamNdjsonMiddleware;
//# sourceMappingURL=streamNdjsonMiddleware.js.map