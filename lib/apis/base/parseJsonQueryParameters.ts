const parseJsonQueryParameters = function (query: any): any {
  const parsedQuery: any = {};

  // eslint-disable-next-line guard-for-in
  for (const [ key, value ] of Object.entries(query)) {
    try {
      parsedQuery[key] = JSON.parse(value);
    } catch {
      parsedQuery[key] = value;
    }
  }

  return parsedQuery;
};

export { parseJsonQueryParameters };
