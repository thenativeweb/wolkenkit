import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { RequestHandler } from 'express';
import { validateAggregateIdentifier } from '../../../../common/validators/validateAggregateIdentifier';

const getLastDomainEvent = function ({
  domainEventStore
}: {
  domainEventStore: DomainEventStore;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    let aggregateIdentifier;

    try {
      aggregateIdentifier = JSON.parse(req.query.aggregateIdentifier);

      validateAggregateIdentifier({ aggregateIdentifier });
    } catch (ex) {
      const error = new errors.AggregateIdentifierMalformed(ex.message);

      return res.status(400).json({
        code: error.code,
        message: error.message
      });
    }

    try {
      const lastDomainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

      if (!lastDomainEvent) {
        return res.status(404).end();
      }

      res.json(lastDomainEvent);
    } catch (ex) {
      return res.status(400).json({
        code: ex.code ?? 'EUNKNOWNERROR',
        message: ex.message
      });
    }
  };
};

export { getLastDomainEvent };
