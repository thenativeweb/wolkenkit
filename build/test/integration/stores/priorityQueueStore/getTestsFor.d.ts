import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
declare const getTestsFor: ({ createPriorityQueueStore }: {
    createPriorityQueueStore: ({ suffix, expirationTime }: {
        suffix: string;
        expirationTime: number;
    }) => Promise<PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>>;
}) => void;
export { getTestsFor };
