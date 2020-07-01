import { Client } from '../../../../apis/awaitItem/http/v2/Client';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';

export interface DomainEventDispatcher {
  client: Client<DomainEvent<DomainEventData>, ItemIdentifier>;
  renewalInterval: number;
  acknowledgeRetries: number;
}
