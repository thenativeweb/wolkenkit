import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';
import { validateAggregateIdentifier } from '../../../../common/validators/validateAggregateIdentifier';

const getLastDomainEvent = function ({
  domainEventStore
}: {
  domainEventStore: DomainEventStore;
}): RequestHandler {
  return async function (req, res): Promise<void> {
    let aggregateIdentifier;

    try {
      aggregateIdentifier = JSON.parse(req.query.aggregateIdentifier);

      validateAggregateIdentifier({ aggregateIdentifier });
    } catch (ex) {
      res.status(400).send(ex.message);
    }

    const lastDomainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

    if (!lastDomainEvent) {
      return res.status(404).end();
    }

    res.json(lastDomainEvent);
  };
};

export { getLastDomainEvent };
