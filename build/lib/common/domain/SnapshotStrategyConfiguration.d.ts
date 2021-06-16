export declare type SnapshotStrategyConfiguration = {
    name: 'never';
} | {
    name: 'always';
} | {
    name: 'lowest';
    configuration: {
        revisionLimit: number;
        durationLimit: number;
    };
} | {
    name: 'revision';
    configuration: {
        revisionLimit: number;
    };
} | {
    name: 'duration';
    configuration: {
        durationLimit: number;
    };
};
