import { Application } from 'express';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/publishMessage/http/v2/Client';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { getApi } from '../../../../lib/apis/publishMessage/http';
import { runAsServer } from '../../../shared/http/runAsServer';

suite('publishMessage/http/Client', (): void => {
  suite('/v2', (): void => {
    suite('postMessage', (): void => {
      let api: Application,
          receivedMessages: object[];

      setup(async (): Promise<void> => {
        receivedMessages = [];

        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveMessage ({ channel, message }: {
            channel: string;
            message: object;
          }): Promise<void> {
            receivedMessages.push({ channel, message });
          }
        }));
      });

      test('sends messages.', async (): Promise<void> => {
        const message = { text: 'Hello world!' };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await client.postMessage({ channel: 'messages', message });

        assert.that(receivedMessages.length).is.equalTo(1);
        assert.that(receivedMessages[0]).is.equalTo({ channel: 'messages', message });
      });

      test('throws an error if on received message throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveMessage (): Promise<void> {
            throw new Error('Failed to handle received message.');
          }
        }));

        const message = { text: 'Hello world!' };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postMessage({ channel: 'messages', message });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.UnknownError.code &&
          (ex as CustomError).message === 'Unknown error.');
      });
    });
  });
});
