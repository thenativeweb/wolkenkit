import { Application } from 'express';
import { assert } from 'assertthat';
import { getApi } from '../../../../lib/apis/getHealth/http';
import { Value } from 'validate-value';
import supertest, { Response } from 'supertest';

suite('getHealth/http', (): void => {
  suite('/v2', (): void => {
    suite('GET /', (): void => {
      let api: Application;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({ corsOrigin: '*' }));
      });

      test('returns 200.', async (): Promise<void> => {
        await supertest(api).
          get('/v2/').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
          });
      });

      test('returns application/json.', async (): Promise<void> => {
        await supertest(api).
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

        await supertest(api).
          get('/v2/').
          expect((res: Response): void => {
            assert.that((): void => {
              value.validate(res.body);
            }).is.not.throwing();
          });
      });
    });
  });
});
