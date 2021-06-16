declare const postgres: {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export { postgres };
