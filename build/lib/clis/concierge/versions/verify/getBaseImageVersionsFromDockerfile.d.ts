declare const getBaseImageVersionsFromDockerfile: ({ dockerfilePath, baseImage }: {
    dockerfilePath: string;
    baseImage: string;
}) => Promise<{
    line: number;
    version: string;
}[]>;
export { getBaseImageVersionsFromDockerfile };
