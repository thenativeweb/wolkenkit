import { Application } from 'express';
import { assert } from 'assertthat';
import { getApi } from '../../../../lib/apis/getStatic/http';
import path from 'path';
import supertest, { Response } from 'supertest';

suite('static/http', (): void => {
  const directory = path.join(__dirname, '..', '..', '..', 'shared', 'serveStatic');

  suite('GET /', (): void => {
    let api: Application;

    setup(async (): Promise<void> => {
      ({ api } = await getApi({ corsOrigin: '*', directory }));
    });

    test('serves static content.', async (): Promise<void> => {
      await supertest(api).
        get('/').
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(200);
          assert.that(res.header['content-type']).is.equalTo('text/html; charset=UTF-8');
          assert.that(res.text).is.startingWith('<!doctype html>\n<html>');
          assert.that(res.text).is.endingWith('</html>\n');
        });
    });
  });
});
