import { assert } from 'assertthat';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/landingPage/http';
import { runAsServer } from '../../../shared/http/runAsServer';

suite('landingPage/http', (): void => {
  let api: ExpressApplication;

  setup(async (): Promise<void> => {
    ({ api } = await getApi());
  });

  suite('GET /', (): void => {
    test('returns 200.', async (): Promise<void> => {
      const { client } = await runAsServer({ app: api });

      const { status } = await client({
        method: 'get',
        url: '/'
      });

      assert.that(status).is.equalTo(200);
    });

    test('returns the content type text/html.', async (): Promise<void> => {
      const { client } = await runAsServer({ app: api });

      const { headers } = await client({
        method: 'get',
        url: '/'
      });

      assert.that(headers['content-type']).is.equalTo('text/html; charset=utf-8');
    });

    test('returns the landing page.', async (): Promise<void> => {
      const { client } = await runAsServer({ app: api });

      const { data } = await client({
        method: 'get',
        url: '/'
      });

      assert.that(data as string).is.containing('html');
    });
  });
});
