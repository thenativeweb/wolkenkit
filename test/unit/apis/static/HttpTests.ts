import { assert } from 'assertthat';
import { Http } from '../../../../lib/apis/static/Http';
import path from 'path';
import supertest, { Response } from 'supertest';

suite('static/Http', (): void => {
  let serveStatic: string;

  setup(async (): Promise<void> => {
    serveStatic = path.join(__dirname, '..', '..', '..', 'shared', 'serveStatic');
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
        const http = await Http.create({
          corsOrigin: corsOrigin.allow,
          serveStatic
        });

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

  suite('GET /', (): void => {
    let http: Http;

    setup(async (): Promise<void> => {
      http = await Http.create({
        corsOrigin: '*',
        serveStatic
      });
    });

    test('serves static content.', async (): Promise<void> => {
      await supertest(http.api).
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
