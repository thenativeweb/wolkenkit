export interface Queue {
    discriminator: string;
    index: number;
    priority: number;
    lock?: {
        until: number;
        token: string;
    };
}
