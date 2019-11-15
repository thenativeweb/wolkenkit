import { uuid } from 'uuidv4';
import { Request, RequestHandler, Response } from 'express-serve-static-core';

const getDomainEvents = function ({ connections, writeLine, heartbeatInterval }: {
  connections: Record<string, { req: Request; res: Response } | undefined>;
  writeLine: (args: {
    connectionId: string;
    data: object;
  }) => void;
  heartbeatInterval: number;
}): RequestHandler {
  return async function (req: Request, res: Response): Promise<void> {
    const connectionId = uuid();
    let heartbeatIntervalId: NodeJS.Timeout;

    req.setTimeout(0, (): void => undefined);
    res.setTimeout(0);

    const onClose = function (): void {
      res.connection.removeListener('close', onClose);
      clearInterval(heartbeatIntervalId);
      /* eslint-disable no-param-reassign */
      delete connections[connectionId];
      /* eslint-enable no-param-reassign */
    };

    res.connection.once('close', onClose);
    res.writeHead(200, { 'content-type': 'application/x-ndjson' });

    /* eslint-disable no-param-reassign */
    connections[connectionId] = { req, res };
    /* eslint-enable no-param-reassign */

    // Send an initial heartbeat to initialize the connection. If we do not do
    // this, sometimes the connection does not become open until the first data
    // is sent.
    writeLine({ connectionId, data: { name: 'heartbeat' }});

    heartbeatIntervalId = setInterval((): void => {
      writeLine({ connectionId, data: { name: 'heartbeat' }});
    }, heartbeatInterval);
  };
};

export { getDomainEvents };
