import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getReplay = function ({
  domainEventStore,
  newDomainEventSubscriber,
  newDomainEventSubscriberChannel
}: {
  domainEventStore: DomainEventStore;
  newDomainEventSubscriber: Subscriber<object>;
  newDomainEventSubscriberChannel: string;
}): RequestHandler {
  return async function (req, res): Promise<void> {
  };
};

export { getReplay };
