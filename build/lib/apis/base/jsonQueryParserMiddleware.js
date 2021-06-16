"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonQueryParserMiddleware = void 0;
const url_1 = require("url");
const jsonQueryParserMiddleware = function (req, res, next) {
    const url = url_1.parse(req.originalUrl);
    const queryString = url.query;
    const parsedQuery = {};
    if (queryString !== null) {
        const queryParts = queryString.split('&');
        for (const queryPart of queryParts) {
            const [key, value] = queryPart.split('=');
            const decodedKey = decodeURIComponent(key), decodedValue = decodeURIComponent(value);
            try {
                parsedQuery[decodedKey] = JSON.parse(decodedValue);
            }
            catch {
                parsedQuery[decodedKey] = decodedValue;
            }
        }
    }
    // eslint-disable-next-line no-param-reassign
    req.query = parsedQuery;
    next();
};
exports.jsonQueryParserMiddleware = jsonQueryParserMiddleware;
//# sourceMappingURL=jsonQueryParserMiddleware.js.map