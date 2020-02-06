import { Application } from 'express';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/getHealth/http/v2/Client';
import { getApi } from '../../../../lib/apis/getHealth/http';
import { runAsServer } from '../../../shared/http/runAsServer';
import { Value } from 'validate-value';

suite('getHealth/http/Client', (): void => {
  suite('/v2', (): void => {
    suite('getHealth', (): void => {
      let api: Application;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({ corsOrigin: '*' }));
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

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const data = await client.getHealth();

        assert.that((): void => {
          value.validate(data);
        }).is.not.throwing();
      });
    });
  });
});
