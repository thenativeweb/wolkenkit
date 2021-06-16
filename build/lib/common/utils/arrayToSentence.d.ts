declare const arrayToSentence: ({ data, conjunction, itemPrefix, itemSuffix }: {
    data: any[];
    conjunction: string;
    itemPrefix?: string | undefined;
    itemSuffix?: string | undefined;
}) => string;
export { arrayToSentence };
