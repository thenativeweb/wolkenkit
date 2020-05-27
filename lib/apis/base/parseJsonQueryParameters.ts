const parseJsonQueryParameters = function (query: any): any {
  const parsedQuery: any = {};

  // eslint-disable-next-line guard-for-in
  for (const key in query) {
    try {
      parsedQuery[key] = JSON.parse(query[key]);
    } catch {
      parsedQuery[key] = query[key];
    }
  }

  return parsedQuery;
};

export { parseJsonQueryParameters };
