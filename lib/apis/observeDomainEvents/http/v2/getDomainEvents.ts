import { Repository } from '../../../../common/domain/Repository';
import { writeLine } from '../../../base/writeLine';
import { Request, RequestHandler, Response } from 'express';

const heartbeat = { name: 'heartbeat' };

const getDomainEvents = function ({ heartbeatInterval, repository }: {
  heartbeatInterval: number;
  repository: Repository;
}): RequestHandler {
  return async function (req: Request, res: Response): Promise<void> {
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
  };
};

export { getDomainEvents };
