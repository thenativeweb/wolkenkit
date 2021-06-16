import { DoesIdentifierMatchItem } from '../../stores/priorityQueueStore/DoesIdentifierMatchItem';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { ItemIdentifierWithClient } from '../elements/ItemIdentifierWithClient';
declare const doesItemIdentifierWithClientMatchDomainEvent: DoesIdentifierMatchItem<DomainEvent<DomainEventData>, ItemIdentifierWithClient>;
export { doesItemIdentifierWithClientMatchDomainEvent };
