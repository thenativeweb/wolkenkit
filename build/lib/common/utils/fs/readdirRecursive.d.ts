declare const readdirRecursive: ({ path }: {
    path: string;
}) => Promise<{
    directories: string[];
    files: string[];
}>;
export { readdirRecursive };
