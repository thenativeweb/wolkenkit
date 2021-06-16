declare const getAvailablePorts: ({ count }: {
    count: number;
}) => Promise<number[]>;
export { getAvailablePorts };
