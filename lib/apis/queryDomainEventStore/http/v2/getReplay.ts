import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { parseGetReplayQueryParameters } from './parameters/parseGetReplayQueryParameters';
import { RequestHandler } from 'express';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { writeLine } from '../../../base/writeLine';

const getReplay = function ({
  domainEventStore,
  heartbeatInterval
}: {
  domainEventStore: DomainEventStore;
  heartbeatInterval: number;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    let fromRevisionGlobal: number | undefined,
        toRevisionGlobal: number | undefined;

    try {
      ({ fromRevisionGlobal, toRevisionGlobal } = parseGetReplayQueryParameters({ parameters: req.query }));
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    const heartbeatMiddleware = streamNdjsonMiddleware({ heartbeatInterval });

    await heartbeatMiddleware(req, res, (): void => {
      // No need for a `next`-callback for this middleware.
    });

    const domainEventStream = await domainEventStore.getReplay({ fromRevisionGlobal, toRevisionGlobal });

    for await (const domainEvent of domainEventStream) {
      writeLine({ res, data: domainEvent });
    }

    return res.end();
  };
};

export { getReplay };
