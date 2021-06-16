declare const buildApplication: ({ applicationDirectory, buildDirectoryOverride }: {
    applicationDirectory: string;
    buildDirectoryOverride?: string | undefined;
}) => Promise<void>;
export { buildApplication };
