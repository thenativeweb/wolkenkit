import { Application } from 'express';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/publishMessage/http/v2/Client';
import { CustomError } from 'defekt';
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
          async onReceiveMessage ({ message }: {
            message: object;
          }): Promise<void> {
            receivedMessages.push(message);
          }
        }));
      });

      test('sends messages.', async (): Promise<void> => {
        const message = { text: 'Hello world!' };

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.postMessage({ message });

        assert.that(receivedMessages.length).is.equalTo(1);
        assert.that(receivedMessages[0]).is.equalTo(message);
      });

      test('throws an error if on received message throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveMessage (): Promise<void> {
            throw new Error('Failed to handle received message.');
          }
        }));

        const message = { text: 'Hello world!' };

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postMessage({ message });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === 'EUNKNOWNERROR' &&
          (ex as CustomError).message === 'Unknown error.');
      });
    });
  });
});
