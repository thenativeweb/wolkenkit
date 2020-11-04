import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { jsonSchema } from '../../../../common/utils/uuid';
import { Schema } from '../../../../common/elements/Schema';
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
        'causation-id': jsonSchema
      },
      required: [ 'causation-id' ],
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
    const querySchema = new Value(getDomainEventsByCausationId.request.query),
          responseBodySchema = new Value(getDomainEventsByCausationId.response.body);

    return async function (req, res): Promise<any> {
      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });
      } catch (ex: unknown) {
        res.status(400).end((ex as Error).message);
      }

      const causationId = req.query['causation-id'] as string;

      res.startStream({ heartbeatInterval });

      const domainEventStream = await domainEventStore.getDomainEventsByCausationId({ causationId });

      for await (const domainEvent of domainEventStream) {
        responseBodySchema.validate(domainEvent, { valueName: 'responseBody' });

        writeLine({ res, data: domainEvent });
      }

      return res.end();
    };
  }
};

export { getDomainEventsByCausationId };
