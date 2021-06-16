import { FlowPriorityQueue } from './FlowPriorityQueue';
declare const acknowledgeDomainEvent: ({ flowName, token, priorityQueue }: {
    flowName: string;
    token: string;
    priorityQueue: FlowPriorityQueue;
}) => Promise<void>;
export { acknowledgeDomainEvent };
