import { flaschenpost } from 'flaschenpost';
import { RequestHandler } from 'express';
import { writeLine } from '../base/writeLine';

const logger = flaschenpost.getLogger();

const heartbeat = { name: 'heartbeat' };

// The streamNdjson middleware initializes a long-lived connection with the
// content type `application/x-ndjson` and sends a periodic heartbeat every
// `heartbeatInterval` milliseconds.
const streamNdjsonMiddleware = function ({
  heartbeatInterval
}: {
  heartbeatInterval: number;
}): RequestHandler {
  return async function (req, res, next): Promise<void> {
    try {
      let heartbeatIntervalId: NodeJS.Timeout;

      req.setTimeout(0, (): void => undefined);
      res.setTimeout(0);

      res.writeHead(200, { 'content-type': 'application/x-ndjson' });

      res.connection.once('close', (): void => {
        clearInterval(heartbeatIntervalId);
      });

      // Send an initial heartbeat to initialize the connection. If we do not do
      // this, sometimes the connection does not become open until the first data
      // is sent.
      writeLine({ res, data: heartbeat });

      heartbeatIntervalId = setInterval((): void => {
        writeLine({ res, data: heartbeat });
      }, heartbeatInterval);

      return next();
    } catch (ex) {
      // It can happen that the connection gets closed in the background, and
      // hence the underlying socket does not have a remote address any more. We
      // can't detect this using an if statement, because connection handling is
      // done by Node.js in a background thread, and we may have a race
      // condition here. So, we decided to actively catch this exception, and
      // take it as an indicator that the connection has been closed meanwhile.
      if (ex.message === 'Remote address is missing.') {
        return;
      }

      logger.error('An unexpected error occured.', { ex });

      throw ex;
    }
  };
};

export { streamNdjsonMiddleware };
