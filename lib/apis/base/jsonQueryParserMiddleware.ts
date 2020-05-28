import { parse } from 'url';
import { RequestHandler } from 'express';

const jsonQueryParserMiddleware: RequestHandler = function (req, res, next): void {
  const url = parse(req.originalUrl);
  const queryString = url.query;

  const parsedQuery: { [key: string]: any } = {};

  if (queryString !== null) {
    const queryParts = queryString.split('&');

    for (const queryPart of queryParts) {
      const [ key, value ] = queryPart.split('=');

      try {
        parsedQuery[key] = JSON.parse(value);
      } catch {
        parsedQuery[key] = value;
      }
    }
  }

  // eslint-disable-next-line no-param-reassign
  req.query = parsedQuery;

  next();
};

export { jsonQueryParserMiddleware };
