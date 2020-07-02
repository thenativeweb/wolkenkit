import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { getApi as getAwaitDomainEventApi } from '../../../../apis/awaitItem/http';
import { getCorsOrigin } from 'get-cors-origin';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { validateDomainEvent } from '../../../../common/validators/validateDomainEvent';
import { Value } from 'validate-value';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  configuration,
  application,
  priorityQueueStore,
  newDomainEventSubscriber,
  newDomainEventPubSubChannel
}: {
  configuration: Configuration;
  application: Application;
  priorityQueueStore: PriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifierWithClient>;
  newDomainEventSubscriber: Subscriber<object>;
  newDomainEventPubSubChannel: string;
}): Promise<{ api: ExpressApplication }> {
  const { api: awaitDomainEventApi } = await getAwaitDomainEventApi<DomainEvent<DomainEventData>>({
    corsOrigin: getCorsOrigin(configuration.awaitCommandCorsOrigin),
    priorityQueueStore,
    newItemSubscriber: newDomainEventSubscriber,
    newItemSubscriberChannel: newDomainEventPubSubChannel,
    validateOutgoingItem ({ item }: {
      item: DomainEvent<DomainEventData>;
    }): void {
      new Value(getDomainEventSchema()).validate(item);
      validateDomainEvent({ application, domainEvent: item });
    }
  });

  const api = express();

  api.use('/await-domain-event', awaitDomainEventApi);

  return { api };
};

export { getApi };
