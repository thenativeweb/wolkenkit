import fs from 'fs';
declare const getFiles: ({ directory, recursive, predicate }: {
    directory: string;
    recursive?: boolean | undefined;
    predicate?: ((entry: fs.Dirent) => boolean) | undefined;
}) => Promise<string[]>;
export { getFiles };
