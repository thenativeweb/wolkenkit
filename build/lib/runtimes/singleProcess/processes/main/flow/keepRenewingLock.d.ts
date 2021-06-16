import { FlowPriorityQueue } from './FlowPriorityQueue';
declare const keepRenewingLock: ({ flowName, flowPromise, priorityQueue, token }: {
    flowName: string;
    flowPromise: Promise<any>;
    priorityQueue: FlowPriorityQueue;
    token: string;
}) => Promise<void>;
export { keepRenewingLock };
