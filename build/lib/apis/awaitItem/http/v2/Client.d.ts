import { HttpClient } from '../../../shared/HttpClient';
import { LockMetadata } from '../../../../stores/priorityQueueStore/LockMetadata';
declare class Client<TItem> extends HttpClient {
    protected createItemInstance: ({ item }: {
        item: TItem;
    }) => TItem;
    constructor({ protocol, hostName, portOrSocket, path, createItemInstance }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
        createItemInstance: ({ item }: {
            item: TItem;
        }) => TItem;
    });
    awaitItem(): Promise<{
        item: TItem;
        metadata: LockMetadata;
    }>;
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
}
export { Client };
