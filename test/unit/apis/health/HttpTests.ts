import assert from 'assertthat';
import Http from '../../../../src/apis/health/Http';
import uuid from 'uuidv4';
import supertest, { Response } from 'supertest';

suite('health/Http', (): void => {
  let processId: string;

  setup(async (): Promise<void> => {
    processId = uuid();
  });

  suite('initialize', (): void => {
    test('sets api to an Express application.', async (): Promise<void> => {
      const http = await Http.initialize({ corsOrigin: '*', processId });

      assert.that(http.api).is.ofType('function');
    });
  });

  suite('CORS', (): void => {
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
      test(corsOrigin.title, async (): Promise<void> => {
        const http = await Http.initialize({ corsOrigin: corsOrigin.allow, processId });

        await supertest(http.api).
          options('/').
          set({
            origin: corsOrigin.origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'X-Requested-With'
          }).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
            assert.that(res.header['access-control-allow-origin']).is.equalTo(corsOrigin.expected);
            assert.that(res.header['access-control-allow-methods']).is.equalTo('GET,POST');
          });
      });
      /* eslint-enable no-loop-func */
    }
  });

  suite('GET /v2/', (): void => {
    let http: Http;

    setup(async (): Promise<void> => {
      http = await Http.initialize({ corsOrigin: '*', processId });
    });

    test('returns 200.', async (): Promise<void> => {
      await supertest(http.api).
        get('/v2/').
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(200);
        });
    });

    test('returns application/json.', async (): Promise<void> => {
      await supertest(http.api).
        get('/v2/').
        expect((res: Response): void => {
          assert.that(res.header['content-type']).is.equalTo('application/json; charset=utf-8');
        });
    });

    test('answers with health information.', async (): Promise<void> => {
      await supertest(http.api).
        get('/v2/').
        expect((res: Response): void => {
          assert.that(res.body).is.equalTo({ processId });
        });
    });
  });
});
