import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { streamNdjsonMiddleware } from '../../../../lib/apis/middlewares/streamNdjson';
import supertest from 'supertest';
import express, { Application } from 'express';

suite('streamNdjson middleware', (): void => {
  let api: Application;

  setup(async (): Promise<void> => {
    api = express();
    api.get('/', streamNdjsonMiddleware({ heartbeatInterval: 1000 }));
  });

  test('returns the status code 200.', async (): Promise<void> => {
    await new Promise((resolve, reject): void => {
      try {
        /* eslint-disable @typescript-eslint/no-floating-promises */
        supertest(api).
          get('/').
          expect(200).
          pipe(asJsonStream<any>(
            (): void => {
              resolve();
            }
          ));
        /* eslint-enable @typescript-eslint/no-floating-promises */
      } catch (ex) {
        reject(ex);
      }
    });
  });

  test('returns application/x-ndjson.', async (): Promise<void> => {
    await new Promise((resolve, reject): void => {
      try {
        /* eslint-disable @typescript-eslint/no-floating-promises */
        supertest(api).
          get('/').
          expect('Content-Type', 'application/x-ndjson').
          pipe(asJsonStream<any>(
            (): void => {
              resolve();
            }
          ));
        /* eslint-ensable @typescript-eslint/no-floating-promises */
      } catch (ex) {
        reject(ex);
      }
    });
  });

  test('sends a periodic heartbeat.', async (): Promise<void> => {
    await new Promise((resolve, reject): void => {
      try {
        supertest(api).get('/').pipe(asJsonStream<any>(
          (streamElement): void => {
            assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
          },
          (streamElement): void => {
            assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            resolve();
          }
        ));
      } catch (ex) {
        reject(ex);
      }
    });
  });
});
