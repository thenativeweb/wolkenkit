import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const getAggregateIdentifiers = {
  description: 'Streams all aggregate identifiers that have domain events in the store.',
  path: 'get-aggregate-identifiers',

  request: {
    query: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400 ],

    stream: true,
    body: getAggregateIdentifierSchema()
  },

  getHandler ({
    domainEventStore,
    heartbeatInterval
  }: {
    domainEventStore: DomainEventStore;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    const querySchema = new Value(getAggregateIdentifiers.request.query),
          responseBodySchema = new Value(getAggregateIdentifiers.response.body);

    return async function (req, res): Promise<any> {
      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });
      } catch (ex: unknown) {
        return res.status(400).send((ex as Error).message);
      }

      res.startStream({ heartbeatInterval });

      const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiers();

      for await (const aggregateIdentifier of aggregateIdentifierStream) {
        responseBodySchema.validate(aggregateIdentifier, { valueName: 'responseBody' });

        writeLine({ res, data: aggregateIdentifier });
      }

      return res.end();
    };
  }
};

export { getAggregateIdentifiers };
