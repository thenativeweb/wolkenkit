import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';

const storeSnapshot = function ({
  domainEventStore
}: {
  domainEventStore: DomainEventStore;
}): RequestHandler {
  return async function (req, res): Promise<void> {
  };
};

export { storeSnapshot };
