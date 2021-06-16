declare const redis: {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export { redis };
