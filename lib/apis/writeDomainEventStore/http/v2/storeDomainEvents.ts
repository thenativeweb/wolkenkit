import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';
import { Publisher } from '../../../../messaging/pubSub/Publisher';

const storeDomainEvents = function ({
  domainEventStore,
  newDomainEventPublisher,
  newDomainEventPublisherChannel
}: {
  domainEventStore: DomainEventStore;
  newDomainEventPublisher: Publisher<object>;
  newDomainEventPublisherChannel: string;
}): RequestHandler {
  return async function (req, res): Promise<void> {
  };
};

export { storeDomainEvents };
