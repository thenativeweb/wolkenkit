"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const jsonQueryParserMiddleware_1 = require("../../../../lib/apis/base/jsonQueryParserMiddleware");
suite('jsonQueryParserMiddleware', () => {
    test('adds an empty object to the request if no query string is present.', async () => {
        const request = {
            originalUrl: 'https://localhost/'
        };
        await new Promise((resolve, reject) => {
            try {
                jsonQueryParserMiddleware_1.jsonQueryParserMiddleware(request, {}, resolve);
            }
            catch (ex) {
                reject(ex);
            }
        });
        assertthat_1.assert.that(request.query).is.equalTo({});
    });
    test('adds an object containing parsed query parameters to the request.', async () => {
        const request = {
            originalUrl: 'https://localhost/?foo=5&bar={"foo":"bar"}&baz=false'
        };
        await new Promise((resolve, reject) => {
            try {
                jsonQueryParserMiddleware_1.jsonQueryParserMiddleware(request, {}, resolve);
            }
            catch (ex) {
                reject(ex);
            }
        });
        assertthat_1.assert.that(request.query).is.equalTo({
            foo: 5,
            bar: {
                foo: 'bar'
            },
            baz: false
        });
    });
    test('treats unparseable values as strings.', async () => {
        const request = {
            originalUrl: 'https://localhost/?foo=bar'
        };
        await new Promise((resolve, reject) => {
            try {
                jsonQueryParserMiddleware_1.jsonQueryParserMiddleware(request, {}, resolve);
            }
            catch (ex) {
                reject(ex);
            }
        });
        assertthat_1.assert.that(request.query).is.equalTo({
            foo: 'bar'
        });
    });
});
//# sourceMappingURL=jsonQueryParserMiddlewareTests.js.map