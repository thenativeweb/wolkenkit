import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { jsonSchema } from 'uuidv4';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const getDomainEventsByCausationId = {
  description: 'Streams all domain events with a matching causation id.',
  path: 'domain-events-by-causation-id',

  request: {
    query: {
      type: 'object',
      properties: {
        'causation-id': jsonSchema.v4
      },
      required: [ 'causation-id' ],
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
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(getDomainEventsByCausationId.response.body);

    return async function (req, res): Promise<any> {
      const causationId = req.query['causation-id'] as string;

      const heartbeatMiddleware = streamNdjsonMiddleware({ heartbeatInterval });

      await heartbeatMiddleware(req, res, (): void => {
        // No need for a `next`-callback for this middleware.
      });

      const domainEventStream = await domainEventStore.getDomainEventsByCausationId({ causationId });

      for await (const domainEvent of domainEventStream) {
        responseBodySchema.validate(domainEvent);

        writeLine({ res, data: domainEvent });
      }

      return res.end();
    };
  }
};

export { getDomainEventsByCausationId };
