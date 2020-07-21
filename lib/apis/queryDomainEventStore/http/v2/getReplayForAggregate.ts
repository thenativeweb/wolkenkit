import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isUuid } from 'uuidv4';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const getReplayForAggregate = {
  description: `Streams a replay of an aggregate's domain events, optionally starting and ending at given revisions.`,
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
    statusCodes: [ 200, 400 ],

    stream: true,
    body: getDomainEventSchema()
  },

  getHandler ({
    domainEventStore,
    heartbeatInterval
  }: {
    domainEventStore: DomainEventStore;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    const querySchema = new Value(getReplayForAggregate.request.query),
          responseBodySchema = new Value(getReplayForAggregate.response.body);

    return async function (req, res): Promise<any> {
      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });
      } catch (ex) {
        return res.status(400).send(ex.message);
      }

      const fromRevision = req.query.fromRevision as number,
            toRevision = req.query.toRevision as number;

      if (fromRevision && toRevision && fromRevision > toRevision) {
        return res.status(400).send(`Query parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
      }

      const { aggregateId } = req.params;

      if (!isUuid(aggregateId)) {
        return res.status(400).end('Aggregate id must be a uuid.');
      }

      res.startStream({ heartbeatInterval });

      const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId, fromRevision, toRevision });

      for await (const domainEvent of domainEventStream) {
        responseBodySchema.validate(domainEvent, { valueName: 'responseBody' });

        writeLine({ res, data: domainEvent });
      }

      return res.end();
    };
  }
};

export { getReplayForAggregate };
