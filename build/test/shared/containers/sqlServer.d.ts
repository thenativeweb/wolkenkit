declare const sqlServer: {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export { sqlServer };
