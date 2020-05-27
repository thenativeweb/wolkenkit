import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isUuid } from 'uuidv4';
import { parseJsonQueryParameters } from '../../../base/parseJsonQueryParameters';
import { RequestHandler } from 'express';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { Value } from 'validate-value';
import { writeLine } from '../../../base/writeLine';

const getReplayForAggregate = {
  description: `Streams a replay of an aggregate's events, optionally starting and ending at given revisions.`,
  path: 'replay/:aggregateId',

  request: {
    query: {
      type: 'object',
      properties: {
        fromRevision: { type: 'number', minimum: 1 },
        toRevision: { type: 'number', minimum: 1 }
      },
      required: [],
      additionalProperties: false
    }
  },
  response: {
    statusCodes: [ 200 ],

    stream: true,
    body: getDomainEventSchema()
  },

  getHandler ({
    domainEventStore,
    heartbeatInterval
  }: {
    domainEventStore: DomainEventStore;
    heartbeatInterval: number;
  }): RequestHandler {
    const querySchema = new Value(getReplayForAggregate.request.query),
          responseBodySchema = new Value(getReplayForAggregate.response.body);

    return async function (req, res): Promise<any> {
      let fromRevision: number | undefined,
          toRevision: number | undefined;

      try {
        const query = parseJsonQueryParameters(req.query);

        querySchema.validate(query);
        ({ fromRevision, toRevision } = query);

        if (fromRevision && toRevision && fromRevision > toRevision) {
          return res.status(400).send(`Query parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
        }
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
        responseBodySchema.validate(domainEvent);

        writeLine({ res, data: domainEvent });
      }

      return res.end();
    };
  }
};

export { getReplayForAggregate };
