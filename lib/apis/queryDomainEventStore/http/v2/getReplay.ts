import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
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
        fromTimestamp: { type: 'number', minimum: 0 }
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
      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });
      } catch (ex) {
        return res.status(400).send(ex.message);
      }

      const fromTimestamp = req.query.fromTimestamp as number;

      res.startStream({ heartbeatInterval });

      const domainEventStream = await domainEventStore.getReplay({ fromTimestamp });

      for await (const domainEvent of domainEventStream) {
        responseBodySchema.validate(domainEvent, { valueName: 'responseBody' });

        writeLine({ res, data: domainEvent });
      }

      return res.end();
    };
  }
};

export { getReplay };
