import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { forAwaitOf } from '../../../../common/utils/forAwaitOf';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { Schema } from '../../../../common/elements/Schema';
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
    } as Schema
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
      } catch (ex: unknown) {
        return res.status(400).send((ex as Error).message);
      }

      const fromTimestamp = req.query.fromTimestamp as number;

      res.startStream({ heartbeatInterval });

      const domainEventStream = await domainEventStore.getReplay({ fromTimestamp });

      await forAwaitOf(domainEventStream, async (domainEvent): Promise<void> => {
        responseBodySchema.validate(domainEvent, { valueName: 'responseBody' });

        writeLine({ res, data: domainEvent });
      });

      return res.end();
    };
  }
};

export { getReplay };
