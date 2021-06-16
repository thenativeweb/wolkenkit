declare const runHealthServer: ({ corsOrigin, portOrSocket }: {
    corsOrigin: string | string[];
    portOrSocket: number | string;
}) => Promise<void>;
export { runHealthServer };
