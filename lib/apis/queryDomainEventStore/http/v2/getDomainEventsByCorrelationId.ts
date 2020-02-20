import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { writeLine } from '../../../base/writeLine';

const getDomainEventsByCorrelationId = function ({
  domainEventStore,
  heartbeatInterval
}: {
  domainEventStore: DomainEventStore;
  heartbeatInterval: number;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    const correlationId = req.query['correlation-id'];

    const heartbeatMiddleware = streamNdjsonMiddleware({ heartbeatInterval });

    await heartbeatMiddleware(req, res, (): void => {
      // No need for a `next`-callback for this middleware.
    });

    const domainEventStream = await domainEventStore.getDomainEventsByCorrelationId({ correlationId });

    for await (const domainEvent of domainEventStream) {
      writeLine({ res, data: domainEvent });
    }

    return res.end();
  };
};

export { getDomainEventsByCorrelationId };
