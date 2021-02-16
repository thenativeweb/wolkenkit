import { flaschenpost } from 'flaschenpost';
import { WolkenkitRequestHandler } from './WolkenkitRequestHandler';
import { writeLine } from './writeLine';

const logger = flaschenpost.getLogger();

const heartbeat = { name: 'heartbeat' };

// The streamNdjson middleware initializes a long-lived connection with the
// content type `application/x-ndjson` and sends a periodic heartbeat every
// `heartbeatInterval` milliseconds.
const streamNdjsonMiddleware: WolkenkitRequestHandler = async function (
  req,
  res,
  next
): Promise<void> {
  // eslint-disable-next-line no-param-reassign
  res.startStream = function ({ heartbeatInterval }): void {
    try {
      let heartbeatIntervalId: NodeJS.Timeout;

      req.setTimeout(0, (): void => {
        // Intentionally left blank.
      });
      res.setTimeout(0);

      res.writeHead(200, { 'content-type': 'application/x-ndjson' });

      res.socket?.once('close', (): void => {
        if (heartbeatInterval !== false) {
          clearInterval(heartbeatIntervalId);
        }
      });

      if (heartbeatInterval !== false) {
        // Send an initial heartbeat to initialize the connection. If we do not do
        // this, sometimes the connection does not become open until the first data
        // is sent.
        writeLine({ res, data: heartbeat });

        heartbeatIntervalId = setInterval((): void => {
          writeLine({ res, data: heartbeat });
        }, heartbeatInterval);
      }

      return next();
    } catch (ex: unknown) {
      // It can happen that the connection gets closed in the background, and
      // hence the underlying socket does not have a remote address any more. We
      // can't detect this using an if statement, because connection handling is
      // done by Node.js in a background thread, and we may have a race
      // condition here. So, we decided to actively catch this exception, and
      // take it as an indicator that the connection has been closed meanwhile.
      if (ex instanceof Error && ex.message === 'Remote address is missing.') {
        return;
      }

      logger.error('An unexpected error occured.', { ex });

      throw ex;
    }
  };

  next();
};

export { streamNdjsonMiddleware };
