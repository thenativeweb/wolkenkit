import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { InMemoryConsumerProgressStoreOptions } from './InMemoryConsumerProgressStoreOptions';
import { IsReplaying } from '../IsReplaying';
declare class InMemoryConsumerProgressStore implements ConsumerProgressStore {
    protected progress: Record<string, Record<string, {
        revision: number;
        isReplaying: IsReplaying;
    } | undefined> | undefined>;
    protected constructor();
    static create(options: InMemoryConsumerProgressStoreOptions): Promise<InMemoryConsumerProgressStore>;
    getProgress({ consumerId, aggregateIdentifier }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<{
        revision: number;
        isReplaying: IsReplaying;
    }>;
    setProgress({ consumerId, aggregateIdentifier, revision }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        revision: number;
    }): Promise<void>;
    setIsReplaying({ consumerId, aggregateIdentifier, isReplaying }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        isReplaying: IsReplaying;
    }): Promise<void>;
    resetProgress({ consumerId }: {
        consumerId: string;
    }): Promise<void>;
    resetProgressToRevision({ consumerId, aggregateIdentifier, revision }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        revision: number;
    }): Promise<void>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { InMemoryConsumerProgressStore };
