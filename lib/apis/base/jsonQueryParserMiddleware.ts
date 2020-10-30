import { parse } from 'url';
import { RequestHandler } from 'express';

const jsonQueryParserMiddleware: RequestHandler = function (req, res, next): void {
  const url = parse(req.originalUrl);
  const queryString = url.query;

  const parsedQuery: Record<string, any> = {};

  if (queryString !== null) {
    const queryParts = queryString.split('&');

    for (const queryPart of queryParts) {
      const [ key, value ] = queryPart.split('=');

      const decodedKey = decodeURIComponent(key),
            decodedValue = decodeURIComponent(value);

      try {
        parsedQuery[decodedKey] = JSON.parse(decodedValue);
      } catch {
        parsedQuery[decodedKey] = decodedValue;
      }
    }
  }

  // eslint-disable-next-line no-param-reassign
  req.query = parsedQuery;

  next();
};

export { jsonQueryParserMiddleware };
