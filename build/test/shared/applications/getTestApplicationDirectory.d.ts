declare const getTestApplicationDirectory: ({ name, language }: {
    name: string;
    language?: "javascript" | "typescript" | undefined;
}) => string;
export { getTestApplicationDirectory };
