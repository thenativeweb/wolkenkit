import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { runAsServer } from '../../../shared/http/runAsServer';
import { streamNdjsonMiddleware } from '../../../../lib/apis/middlewares/streamNdjson';
import express, { Application } from 'express';

suite('streamNdjson middleware', (): void => {
  let app: Application;

  setup(async (): Promise<void> => {
    app = express();
    app.get('/', streamNdjsonMiddleware({ heartbeatInterval: 1000 }));
  });

  test('returns the status code 200.', async (): Promise<void> => {
    const client = await runAsServer({ app });

    const { status } = await client({
      method: 'get',
      url: '/',
      responseType: 'stream'
    });

    assert.that(status).is.equalTo(200);
  });

  test('returns the content-type application/x-ndjson.', async (): Promise<void> => {
    const client = await runAsServer({ app });

    const { headers } = await client({
      method: 'get',
      url: '/',
      responseType: 'stream'
    });

    assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
  });

  test('sends a periodic heartbeat.', async (): Promise<void> => {
    const client = await runAsServer({ app });

    const { data } = await client({
      method: 'get',
      url: '/',
      responseType: 'stream'
    });

    await new Promise((resolve, reject): void => {
      try {
        data.pipe(asJsonStream<any>(
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
