import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';

const getSnapshot = function ({
  domainEventStore
}: {
  domainEventStore: DomainEventStore;
}): RequestHandler {
  return async function (req, res): Promise<void> {
  };
};

export { getSnapshot };
