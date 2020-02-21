import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { isUuid } from 'uuidv4';
import { parseGetReplayForAggregateQueryParameters } from './parameters/parseGetReplayForAggregateQueryParameters';
import { RequestHandler } from 'express';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { writeLine } from '../../../base/writeLine';

const getReplayForAggregate = function ({
  domainEventStore,
  heartbeatInterval
}: {
  domainEventStore: DomainEventStore;
  heartbeatInterval: number;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    let fromRevision: number | undefined,
        toRevision: number | undefined;

    try {
      ({ fromRevision, toRevision } = parseGetReplayForAggregateQueryParameters({ parameters: req.query }));
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    const { aggregateId } = req.params;

    if (!isUuid(aggregateId)) {
      return res.status(400).end('Aggregate id must be a uuid.');
    }

    const heartbeatMiddleware = streamNdjsonMiddleware({ heartbeatInterval });

    await heartbeatMiddleware(req, res, (): void => {
      // No need for a `next`-callback for this middleware.
    });

    const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId, fromRevision, toRevision });

    for await (const domainEvent of domainEventStream) {
      writeLine({ res, data: domainEvent });
    }

    return res.end();
  };
};

export { getReplayForAggregate };
