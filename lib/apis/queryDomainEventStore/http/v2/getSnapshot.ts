import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { getSnapshotSchema } from '../../../../common/schemas/getSnapshotSchema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const getSnapshot = {
  description: 'Returns the latest snapshot for an aggeragte.',
  path: 'snapshot',

  request: {
    query: {
      type: 'object',
      properties: {
        aggregateIdentifier: getAggregateIdentifierSchema()
      },
      required: [ 'aggregateIdentifier' ],
      additionalParameters: false
    }
  },
  response: {
    statusCodes: [ 200, 400, 404 ],

    body: getSnapshotSchema()
  },

  getHandler ({
    domainEventStore
  }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const querySchema = new Value(getSnapshot.request.query),
          responseBodySchema = new Value(getSnapshot.response.body);

    return async function (req, res): Promise<any> {
      const { aggregateIdentifier } = req.query;

      try {
        querySchema.validate(req.query);
      } catch (ex) {
        return res.status(400).send(ex.message);
      }

      try {
        const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

        if (!snapshot) {
          return res.status(404).end();
        }

        responseBodySchema.validate(snapshot);

        res.json(snapshot);
      } catch (ex) {
        logger.error('Unknown error occured.', { ex });

        return res.status(400).json({
          code: ex.code ?? 'EUNKNOWNERROR',
          message: ex.message
        });
      }
    };
  }
};

export { getSnapshot };
