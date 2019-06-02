'use strict';

const path = require('path');

const assert = require('assertthat'),
      supertest = require('supertest');

const { Http } = require('../../../../apis/static');

suite('static/Http', () => {
  let serveStatic;

  setup(async () => {
    serveStatic = path.join(__dirname, '..', '..', '..', 'shared', 'serveStatic');
  });

  test('is a function.', async () => {
    assert.that(Http).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      const http = new Http();

      assert.that(http.initialize).is.ofType('function');
    });

    test('throws an error if CORS origin is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          serveStatic
        });
      }).is.throwingAsync('CORS origin is missing.');
    });

    test('throws an error if serve static is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          corsOrigin: '*'
        });
      }).is.throwingAsync('Serve static is missing.');
    });

    test('sets api to an Express application.', async () => {
      const http = new Http();

      assert.that(http.api).is.undefined();

      await http.initialize({
        corsOrigin: '*',
        serveStatic
      });

      assert.that(http.api).is.ofType('function');
    });
  });

  suite('CORS', () => {
    const corsOrigins = [
      {
        title: 'returns * if anything is allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: '*',
        expected: '*'
      },
      {
        title: 'returns origin if origin is allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: 'http://www.thenativeweb.io',
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns origin if origin is allowed by a regular expression.',
        origin: 'http://www.thenativeweb.io',
        allow: /\.thenativeweb\.io$/u,
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns origin if origin is one of multiple allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: [ 'http://www.thenativeweb.io', 'http://www.example.com' ],
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns undefined if origin is not allowed.',
        origin: 'http://www.example.com',
        allow: 'http://www.thenativeweb.io',
        expected: undefined
      },
      {
        title: 'returns undefined if origin is not allowed by a regular expression.',
        origin: 'http://www.example.com',
        allow: /\.thenativeweb\.io$/u,
        expected: undefined
      }
    ];

    for (const corsOrigin of corsOrigins) {
      /* eslint-disable no-loop-func */
      test(corsOrigin.title, async () => {
        const http = new Http();

        await http.initialize({
          corsOrigin: corsOrigin.allow,
          serveStatic
        });

        const res = await supertest(http.api).
          options('/').
          set({
            origin: corsOrigin.origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'X-Requested-With'
          });

        assert.that(res.statusCode).is.equalTo(200);
        assert.that(res.headers['access-control-allow-origin']).is.equalTo(corsOrigin.expected);
        assert.that(res.headers['access-control-allow-methods']).is.equalTo('GET,POST');
      });
      /* eslint-enable no-loop-func */
    }
  });

  suite('GET /', () => {
    let http;

    setup(async () => {
      http = new Http();

      await http.initialize({
        corsOrigin: '*',
        serveStatic
      });
    });

    test('serves static content.', async () => {
      const res = await supertest(http.api).get('/');

      assert.that(res.statusCode).is.equalTo(200);
      assert.that(res.headers['content-type']).is.equalTo('text/html; charset=UTF-8');
      assert.that(res.text).is.startingWith('<!doctype html>\n<html>');
      assert.that(res.text).is.endingWith('</html>\n');
    });
  });
});
