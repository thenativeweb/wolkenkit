import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { getApi as getAwaitDomainEventApi } from '../../../../apis/awaitItem/http';
import { getCorsOrigin } from 'get-cors-origin';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { getApi as getHandleDomainEventApi } from '../../../../apis/handleDomainEvent/http';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
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
  newDomainEventPubSubChannel,
  onReceiveDomainEvent
}: {
  configuration: Configuration;
  application: Application;
  priorityQueueStore: PriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifier>;
  newDomainEventSubscriber: Subscriber<object>;
  newDomainEventPubSubChannel: string;
  onReceiveDomainEvent: OnReceiveDomainEvent;
}): Promise<{ api: ExpressApplication }> {
  const { api: handleDomainEventApi } = await getHandleDomainEventApi({
    corsOrigin: getCorsOrigin(configuration.handleDomainEventCorsOrigin),
    application,
    onReceiveDomainEvent
  });

  const { api: awaitDomainEventApi } = await getAwaitDomainEventApi<DomainEvent<DomainEventData>>({
    corsOrigin: getCorsOrigin(configuration.awaitDomainEventCorsOrigin),
    priorityQueueStore,
    newItemSubscriber: newDomainEventSubscriber,
    newItemSubscriberChannel: newDomainEventPubSubChannel,
    validateOutgoingItem ({ item }: {
      item: DomainEvent<DomainEventData>;
    }): void {
      new Value(getDomainEventSchema()).validate(item, { valueName: 'domainEvent' });
      validateDomainEvent({ application, domainEvent: item });
    }
  });

  const api = express();

  api.use('/handle-domain-event', handleDomainEventApi);
  api.use('/await-domain-event', awaitDomainEventApi);

  return { api };
};

export { getApi };
