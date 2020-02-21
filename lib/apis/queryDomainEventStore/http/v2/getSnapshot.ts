import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express';
import { validateAggregateIdentifier } from '../../../../common/validators/validateAggregateIdentifier';

const getSnapshot = function ({
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
      return res.status(400).send(ex.message);
    }

    const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

    if (!snapshot) {
      return res.status(404).end();
    }

    res.json(snapshot);
  };
};

export { getSnapshot };
