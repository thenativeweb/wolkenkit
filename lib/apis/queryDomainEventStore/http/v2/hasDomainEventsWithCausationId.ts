import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';

const hasDomainEventsWithCausationId = function ({
  domainEventStore
}: {
  domainEventStore: DomainEventStore;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    const causationId = req.query['causation-id'];

    const hasDomainEvents = await domainEventStore.hasDomainEventsWithCausationId({ causationId });

    res.json({ hasDomainEventsWithCausationId: hasDomainEvents });
  };
};

export { hasDomainEventsWithCausationId };
