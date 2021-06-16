declare const compileWithTypeScript: ({ sourceDirectory, targetDirectory }: {
    sourceDirectory: string;
    targetDirectory: string;
}) => Promise<void>;
export { compileWithTypeScript };
