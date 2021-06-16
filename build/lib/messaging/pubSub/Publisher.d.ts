export interface Publisher<T extends object> {
    publish: ({ channel, message }: {
        channel: string;
        message: T;
    }) => Promise<void>;
}
