const sortKeys = function ({ object, recursive = false }: {
  object: any;
  recursive?: boolean;
}): any {
  if (typeof object !== 'object' || Array.isArray(object)) {
    return object;
  }

  return Object.
    keys(object).
    sort((left: string, right: string): number => left.localeCompare(right)).
    reduce((acc: Record<string, any>, key: string): Record<string, any> => {
      let value: any = object[key];

      if (recursive && typeof value === 'object' && !Array.isArray(value)) {
        value = sortKeys({
          object: value,
          recursive
        });
      }

      return { ...acc, [key]: value };
    }, {});
};

export { sortKeys };
