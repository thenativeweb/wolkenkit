export interface Queue<TItem> {
    discriminator: string;
    indexInPriorityQueue: number;
    lock?: {
        until: number;
        token: string;
    };
    items: {
        item: TItem;
        priority: number;
    }[];
}
