import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { CollectionNames } from './CollectionNames';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { IsReplaying } from '../IsReplaying';
import { MongoDbConsumerProgressStoreOptions } from './MongoDbConsumerProgressStoreOptions';
import { Collection, Db, MongoClient } from 'mongodb';
declare class MongoDbConsumerProgressStore implements ConsumerProgressStore {
    protected client: MongoClient;
    protected db: Db;
    protected collectionNames: CollectionNames;
    protected collections: {
        progress: Collection<any>;
    };
    protected constructor({ client, db, collectionNames, collections }: {
        client: MongoClient;
        db: Db;
        collectionNames: CollectionNames;
        collections: {
            progress: Collection<any>;
        };
    });
    protected static onUnexpectedClose(): never;
    static create({ connectionString, collectionNames }: MongoDbConsumerProgressStoreOptions): Promise<MongoDbConsumerProgressStore>;
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
export { MongoDbConsumerProgressStore };
