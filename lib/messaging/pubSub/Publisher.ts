// eslint-disable-next-line @typescript-eslint/ban-types
export interface Publisher<T extends object> {
  publish: ({ channel, message }: {
    channel: string;
    message: T;
  }) => Promise<void>;
}
