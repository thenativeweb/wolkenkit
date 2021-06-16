export interface Subscriber<T> {
    subscribe: ({ channel, callback }: {
        channel: string;
        callback: (message: T) => void | Promise<void>;
    }) => Promise<void>;
    unsubscribe: ({ channel, callback }: {
        channel: string;
        callback: (message: T) => void | Promise<void>;
    }) => Promise<void>;
}
