declare const mariaDb: {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export { mariaDb };
