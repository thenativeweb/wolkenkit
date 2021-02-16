import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const getDomainEventsByCorrelationId = {
  description: 'Streams all domain events with a matching correlation id.',
  path: 'domain-events-by-correlation-id',

  request: {
    query: {
      type: 'object',
      properties: {
        'correlation-id': { type: 'string', format: 'uuid' }
      },
      required: [ 'correlation-id' ],
      additionalProperties: false
    } as Schema
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
    const querySchema = new Value(getDomainEventsByCorrelationId.request.query),
          responseBodySchema = new Value(getDomainEventsByCorrelationId.response.body);

    return async function (req, res): Promise<any> {
      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });
      } catch (ex: unknown) {
        res.status(400).end((ex as Error).message);
      }

      const correlationId = req.query['correlation-id'] as string;

      res.startStream({ heartbeatInterval });

      const domainEventStream = await domainEventStore.getDomainEventsByCorrelationId({ correlationId });

      for await (const domainEvent of domainEventStream) {
        responseBodySchema.validate(domainEvent, { valueName: 'responseBody' });

        writeLine({ res, data: domainEvent });
      }

      return res.end();
    };
  }
};

export { getDomainEventsByCorrelationId };
