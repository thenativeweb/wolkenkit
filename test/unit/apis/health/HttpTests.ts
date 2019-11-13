import assert from 'assertthat';
import { Http } from '../../../../lib/apis/health/Http';
import Value from 'validate-value';
import supertest, { Response } from 'supertest';

suite('health/Http', (): void => {
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
        allow: [ /\.thenativeweb\.io$/u ],
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
        allow: [ /\.thenativeweb\.io$/u ],
        expected: undefined
      }
    ];

    for (const corsOrigin of corsOrigins) {
      /* eslint-disable no-loop-func */
      test(corsOrigin.title, async (): Promise<void> => {
        const http = await Http.create({ corsOrigin: corsOrigin.allow });

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
      http = await Http.create({ corsOrigin: '*' });
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

    test('returns health information.', async (): Promise<void> => {
      const value = new Value({
        type: 'object',
        properties: {
          host: {
            type: 'object',
            properties: {
              architecture: { type: 'string' },
              platform: { type: 'string' }
            },
            required: [ 'architecture', 'platform' ],
            additionalProperties: false
          },
          node: {
            type: 'object',
            properties: {
              version: { type: 'string' }
            },
            required: [ 'version' ],
            additionalProperties: false
          },
          process: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              uptime: { type: 'number' }
            },
            required: [ 'id', 'uptime' ],
            additionalProperties: false
          },
          cpuUsage: {
            type: 'object',
            properties: {
              user: { type: 'number' },
              system: { type: 'number' }
            },
            required: [ 'user', 'system' ],
            additionalProperties: false
          },
          memoryUsage: {
            type: 'object',
            properties: {
              rss: { type: 'number' },
              maxRss: { type: 'number' },
              heapTotal: { type: 'number' },
              heapUsed: { type: 'number' },
              external: { type: 'number' }
            },
            required: [ 'rss', 'maxRss', 'heapTotal', 'heapUsed', 'external' ],
            additionalProperties: false
          },
          diskUsage: {
            type: 'object',
            properties: {
              read: { type: 'number' },
              write: { type: 'number' }
            },
            required: [ 'read', 'write' ],
            additionalProperties: false
          }
        },
        required: [ 'host', 'node', 'process', 'cpuUsage', 'memoryUsage', 'diskUsage' ],
        additionalProperties: false
      });

      await supertest(http.api).
        get('/v2/').
        expect((res: Response): void => {
          assert.that((): void => {
            value.validate(res.body);
          }).is.not.throwing();
        });
    });
  });
});
