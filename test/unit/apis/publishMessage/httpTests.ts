import { Application } from 'express';
import { assert } from 'assertthat';
import { getApi } from '../../../../lib/apis/publishMessage/http';
import { runAsServer } from '../../../shared/http/runAsServer';

suite('publishMessage/http', (): void => {
  suite('/v2', (): void => {
    suite('POST /', (): void => {
      let api: Application,
          receivedMessages: object[];

      setup(async (): Promise<void> => {
        receivedMessages = [];

        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveMessage ({ message }: {
            message: object;
          }): Promise<void> {
            receivedMessages.push(message);
          }
        }));
      });

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          headers: {
            'content-type': ''
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: 'EREQUESTMALFORMED',
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          headers: {
            'content-type': 'text/plain'
          },
          data: 'foobar',
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: 'EREQUESTMALFORMED',
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 200 if a message is sent.', async (): Promise<void> => {
        const message = { text: 'Hello world!' };
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/',
          data: message
        });

        assert.that(status).is.equalTo(200);
      });

      test('receives messages.', async (): Promise<void> => {
        const message = { text: 'Hello world!' };
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/',
          data: message
        });

        assert.that(receivedMessages.length).is.equalTo(1);
        assert.that(receivedMessages[0]).is.equalTo(message);
      });

      test('returns a 200.', async (): Promise<void> => {
        const message = { text: 'Hello world!' };
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/',
          data: message
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns 500 if on received message throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveMessage (): Promise<void> {
            throw new Error('Failed to handle received message.');
          }
        }));

        const message = { text: 'Hello world!' };
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: message,
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
        assert.that(data).is.equalTo({
          code: 'EUNKNOWNERROR',
          message: 'Unknown error.'
        });
      });
    });
  });
});
