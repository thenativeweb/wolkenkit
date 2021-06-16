/// <reference types="node" />
import { LockMetadata } from '../LockMetadata';
import { PassThrough } from 'stream';
import { PriorityQueueObserverOptions } from './PriorityQueueObserverOptions';
import { PriorityQueueStore } from '../PriorityQueueStore';
interface Issue {
    type: 'action' | 'issue' | 'error';
    message: string;
    data?: any;
}
declare const observerErrors: {
    ObserverError: {
        new (parameters?: string | {
            cause?: unknown;
            data?: any;
            message?: string | undefined;
        } | undefined): {
            code: "ObserverError";
            cause?: unknown;
            data?: any;
            name: string;
            message: string;
            stack?: string | undefined;
        };
        code: string;
    };
};
declare class PriorityQueueObserver<TItem extends object, TItemIdentifier extends object> implements PriorityQueueStore<TItem, TItemIdentifier> {
    protected queue: PriorityQueueStore<TItem, TItemIdentifier>;
    protected events: PassThrough;
    protected static readonly defaultExpirationTime = 15000;
    protected constructor(queue: PriorityQueueStore<TItem, TItemIdentifier>);
    protected emitIssue(issue: Issue): void;
    enqueue({ item, discriminator, priority }: {
        item: TItem;
        discriminator: string;
        priority: number;
    }): Promise<void>;
    lockNext(): Promise<{
        item: TItem;
        metadata: LockMetadata;
    } | undefined>;
    renewLock({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    acknowledge({ discriminator, token }: {
        discriminator: string;
        token: string;
    }): Promise<void>;
    defer({ discriminator, token, priority }: {
        discriminator: string;
        token: string;
        priority: number;
    }): Promise<void>;
    remove({ discriminator, itemIdentifier }: {
        discriminator: string;
        itemIdentifier: TItemIdentifier;
    }): Promise<void>;
    setup(): Promise<void>;
    static create<TItem extends object, TItemIdentifier extends object>({ observedQueue }: {
        observedQueue: PriorityQueueStore<TItem, TItemIdentifier>;
    }): Promise<PriorityQueueObserver<TItem, TItemIdentifier>>;
    destroy(): Promise<void>;
    getEvents(): PassThrough;
}
export type { Issue, PriorityQueueObserverOptions };
export { observerErrors, PriorityQueueObserver };
