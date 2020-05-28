import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const getReplay = {
  description: 'Streams a replay of all domain events, optionally starting and ending at given revisions.',
  path: 'replay',

  request: {
    query: {
      type: 'object',
      properties: {
        fromRevisionGlobal: { type: 'number', minimum: 1 },
        toRevisionGlobal: { type: 'number', minimum: 1 }
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
    const querySchema = new Value(getReplay.request.query),
          responseBodySchema = new Value(getReplay.response.body);

    return async function (req, res): Promise<any> {
      let fromRevisionGlobal: number | undefined,
          toRevisionGlobal: number | undefined;

      try {
        querySchema.validate(req.query);
        ({ fromRevisionGlobal, toRevisionGlobal } = req.query);

        if (fromRevisionGlobal && toRevisionGlobal && fromRevisionGlobal > toRevisionGlobal) {
          return res.status(400).send(`Query parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`);
        }
      } catch (ex) {
        return res.status(400).send(ex.message);
      }

      const heartbeatMiddleware = streamNdjsonMiddleware({ heartbeatInterval });

      await heartbeatMiddleware(req, res, (): void => {
        // No need for a `next`-callback for this middleware.
      });

      const domainEventStream = await domainEventStore.getReplay({ fromRevisionGlobal, toRevisionGlobal });

      for await (const domainEvent of domainEventStream) {
        responseBodySchema.validate(domainEvent);

        writeLine({ res, data: domainEvent });
      }

      return res.end();
    };
  }
};

export { getReplay };
