declare const mongoDb: {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export { mongoDb };
