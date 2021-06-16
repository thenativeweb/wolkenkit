export interface Queue<TItem> {
    discriminator: string;
    lock?: {
        until: number;
        token: string;
    };
    items: {
        item: TItem;
        priority: number;
    }[];
}
