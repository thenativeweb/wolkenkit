import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DoesIdentifierMatchItem } from '../../stores/priorityQueueStore/DoesIdentifierMatchItem';
import { isEqual } from 'lodash';
import { ItemIdentifierWithClient } from '../elements/ItemIdentifierWithClient';

const doesItemIdentifierWithClientMatchCommandWithMetadata: DoesIdentifierMatchItem<CommandWithMetadata<CommandData>, ItemIdentifierWithClient> =
    function ({ item, itemIdentifier }): boolean {
      return isEqual(item.contextIdentifier, itemIdentifier.contextIdentifier) &&
        isEqual(item.aggregateIdentifier, itemIdentifier.aggregateIdentifier) &&
        item.name === itemIdentifier.name &&
        item.id === itemIdentifier.id &&
        isEqual(item.metadata.client, itemIdentifier.client);
    };

export { doesItemIdentifierWithClientMatchCommandWithMetadata };
