import { Application } from 'express';
import { assert } from 'assertthat';
import { getApi } from '../../../../lib/apis/getStatic/http';
import path from 'path';
import { runAsServer } from '../../../shared/http/runAsServer';

suite('static/http', (): void => {
  const directory = path.join(__dirname, '..', '..', '..', 'shared', 'serveStatic');

  suite('GET /', (): void => {
    let api: Application;

    setup(async (): Promise<void> => {
      ({ api } = await getApi({ corsOrigin: '*', directory }));
    });

    test('serves static content.', async (): Promise<void> => {
      const client = await runAsServer({ app: api });

      const { status, headers, data } = await client({
        method: 'get',
        url: '/',
        responseType: 'text'
      });

      assert.that(status).is.equalTo(200);
      assert.that(headers['content-type']).is.equalTo('text/html; charset=UTF-8');
      assert.that(data).is.startingWith('<!doctype html>\n<html>');
      assert.that(data).is.endingWith('</html>\n');
    });
  });
});
