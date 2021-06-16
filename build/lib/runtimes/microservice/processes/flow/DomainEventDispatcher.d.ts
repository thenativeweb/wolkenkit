import { Client } from '../../../../apis/awaitItem/http/v2/Client';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
export interface DomainEventDispatcher {
    client: Client<DomainEvent<DomainEventData>>;
    renewalInterval: number;
    acknowledgeRetries: number;
}
