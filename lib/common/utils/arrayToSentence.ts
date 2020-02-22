const getFormat = function ({ itemPrefix, itemSuffix }: {
  itemPrefix: string;
  itemSuffix: string;
}): (item: any) => string {
  return function (item: any): string {
    return `${itemPrefix}${item}${itemSuffix}`;
  };
};

const arrayToSentence = function ({ data, conjunction, itemPrefix = '', itemSuffix = '' }: {
  data: any[];
  conjunction: string;
  itemPrefix?: string;
  itemSuffix?: string;
}): string {
  const format = getFormat({ itemPrefix, itemSuffix });

  if (data.length === 0) {
    return '';
  }
  if (data.length === 1) {
    return format(data[0]);
  }
  if (data.length === 2) {
    return `${format(data[0])} ${conjunction} ${format(data[1])}`;
  }

  return `${data.slice(0, -1).map((item): string => format(item)).join(', ')}, ${conjunction} ${format(data.slice(-1))}`;
};

export { arrayToSentence };
