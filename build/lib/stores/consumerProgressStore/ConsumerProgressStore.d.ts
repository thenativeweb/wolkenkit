import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { IsReplaying } from './IsReplaying';
export interface ConsumerProgressStore {
    getProgress: ({ consumerId, aggregateIdentifier }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
    }) => Promise<{
        revision: number;
        isReplaying: IsReplaying;
    }>;
    setProgress: ({ consumerId, aggregateIdentifier, revision }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        revision: number;
    }) => Promise<void>;
    setIsReplaying: ({ consumerId, aggregateIdentifier, isReplaying }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        isReplaying: IsReplaying;
    }) => Promise<void>;
    resetProgress: ({ consumerId }: {
        consumerId: string;
    }) => Promise<void>;
    resetProgressToRevision: ({ consumerId, aggregateIdentifier, revision }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        revision: number;
    }) => Promise<void>;
    setup: () => Promise<void>;
    destroy: () => Promise<void>;
}
