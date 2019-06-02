'use strict';

const assert = require('assertthat'),
      supertest = require('supertest'),
      uuid = require('uuidv4');

const { Http } = require('../../../../apis/health');

suite('health/Http', () => {
  let processId;

  setup(async () => {
    processId = uuid();
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
        await http.initialize({ processId });
      }).is.throwingAsync('CORS origin is missing.');
    });

    test('throws an error if process id is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({ corsOrigin: '*' });
      }).is.throwingAsync('Process id is missing.');
    });

    test('sets api to an Express application.', async () => {
      const http = new Http();

      assert.that(http.api).is.undefined();

      await http.initialize({ corsOrigin: '*', processId });

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

        await http.initialize({ corsOrigin: corsOrigin.allow, processId });

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

  suite('GET /v2/', () => {
    let http;

    setup(async () => {
      http = new Http();

      await http.initialize({ corsOrigin: '*', processId });
    });

    test('returns 200.', async () => {
      const res = await supertest(http.api).get('/v2/');

      assert.that(res.statusCode).is.equalTo(200);
    });

    test('returns application/json.', async () => {
      const res = await supertest(http.api).get('/v2/');

      assert.that(res.headers['content-type']).is.equalTo('application/json; charset=utf-8');
    });

    test('answers with health information.', async () => {
      const res = await supertest(http.api).get('/v2/');

      assert.that(res.body).is.equalTo({ processId });
    });
  });
});
