declare const copyNonTypeScriptFiles: ({ sourceDirectory, targetDirectory }: {
    sourceDirectory: string;
    targetDirectory: string;
}) => Promise<void>;
export { copyNonTypeScriptFiles };
