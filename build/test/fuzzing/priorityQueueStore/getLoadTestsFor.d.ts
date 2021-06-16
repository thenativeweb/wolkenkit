import { PriorityQueueStore } from '../../../lib/stores/priorityQueueStore/PriorityQueueStore';
interface Item {
    id: string;
}
declare const getLoadTestsFor: ({ createPriorityQueueStore, queueType }: {
    createPriorityQueueStore: ({ suffix, expirationTime }: {
        suffix: string;
        expirationTime: number;
    }) => Promise<PriorityQueueStore<Item, any>>;
    queueType: string;
}) => void;
export { getLoadTestsFor };
