import { DoesIdentifierMatchItem } from '../../stores/priorityQueueStore/DoesIdentifierMatchItem';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { isEqual } from 'lodash';
import { ItemIdentifierWithClient } from '../elements/ItemIdentifierWithClient';

const doesItemIdentifierWithClientMatchDomainEvent: DoesIdentifierMatchItem<DomainEvent<DomainEventData>, ItemIdentifierWithClient> =
    function ({ item, itemIdentifier }): boolean {
      return isEqual(item.aggregateIdentifier, itemIdentifier.aggregateIdentifier) &&
        item.name === itemIdentifier.name &&
        item.id === itemIdentifier.id &&
        isEqual(item.metadata.initiator.user, itemIdentifier.client.user);
    };

export { doesItemIdentifierWithClientMatchDomainEvent };
