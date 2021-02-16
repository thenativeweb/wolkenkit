import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const getAggregateIdentifiersByName = {
  description: 'Streams all aggregate identifiers matching the given name that have domain events in the store.',
  path: 'get-aggregate-identifiers-by-name',

  request: {
    query: {
      type: 'object',
      properties: {
        contextName: { type: 'string', minLength: 1 },
        aggregateName: { type: 'string', minLength: 1 }
      },
      required: [ 'contextName', 'aggregateName' ],
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
    const querySchema = new Value(getAggregateIdentifiersByName.request.query),
          responseBodySchema = new Value(getAggregateIdentifiersByName.response.body);

    return async function (req, res): Promise<any> {
      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });
      } catch (ex: unknown) {
        return res.status(400).send((ex as Error).message);
      }

      res.startStream({ heartbeatInterval });

      const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiersByName({
        contextName: req.query.contextName as string,
        aggregateName: req.query.aggregateName as string
      });

      for await (const aggregateIdentifier of aggregateIdentifierStream) {
        responseBodySchema.validate(aggregateIdentifier, { valueName: 'responseBody' });

        writeLine({ res, data: aggregateIdentifier });
      }

      return res.end();
    };
  }
};

export { getAggregateIdentifiersByName };
