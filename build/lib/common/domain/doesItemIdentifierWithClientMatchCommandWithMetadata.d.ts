import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DoesIdentifierMatchItem } from '../../stores/priorityQueueStore/DoesIdentifierMatchItem';
import { ItemIdentifierWithClient } from '../elements/ItemIdentifierWithClient';
declare const doesItemIdentifierWithClientMatchCommandWithMetadata: DoesIdentifierMatchItem<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
export { doesItemIdentifierWithClientMatchCommandWithMetadata };
