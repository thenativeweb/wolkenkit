import { assert } from 'assertthat';
import { jsonQueryParserMiddleware } from '../../../../lib/apis/base/jsonQueryParserMiddleware';
import { Request, Response } from 'express';

suite('jsonQueryParserMiddleware', (): void => {
  test('adds an empty object to the request if no query string is present.', async (): Promise<void> => {
    const request = {
      originalUrl: 'https://localhost/'
    } as Request;

    await new Promise((resolve, reject): void => {
      try {
        jsonQueryParserMiddleware(request, {} as Response, resolve);
      } catch (ex: unknown) {
        reject(ex);
      }
    });

    assert.that(request.query).is.equalTo({});
  });

  test('adds an object containing parsed query parameters to the request.', async (): Promise<void> => {
    const request = {
      originalUrl: 'https://localhost/?foo=5&bar={"foo":"bar"}&baz=false'
    } as Request;

    await new Promise((resolve, reject): void => {
      try {
        jsonQueryParserMiddleware(request, {} as Response, resolve);
      } catch (ex: unknown) {
        reject(ex);
      }
    });

    assert.that(request.query).is.equalTo({
      foo: 5,
      bar: {
        foo: 'bar'
      },
      baz: false
    });
  });

  test('treats unparseable values as strings.', async (): Promise<void> => {
    const request = {
      originalUrl: 'https://localhost/?foo=bar'
    } as Request;

    await new Promise((resolve, reject): void => {
      try {
        jsonQueryParserMiddleware(request, {} as Response, resolve);
      } catch (ex: unknown) {
        reject(ex);
      }
    });

    assert.that(request.query).is.equalTo({
      foo: 'bar'
    });
  });
});
