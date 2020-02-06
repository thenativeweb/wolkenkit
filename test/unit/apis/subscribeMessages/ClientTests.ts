import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/subscribeMessages/http/v2/Client';
import { getApi } from '../../../../lib/apis/subscribeMessages/http';
import { PublishMessage } from '../../../../lib/apis/subscribeMessages/PublishMessage';
import { runAsServer } from '../../../shared/http/runAsServer';

suite('subscribeMessages/http/Client', (): void => {
  suite('/v2', (): void => {
    suite('getMessages', (): void => {
      let api: Application,
          publishMessage: PublishMessage;

      setup(async (): Promise<void> => {
        ({ api, publishMessage } = await getApi({
          corsOrigin: '*'
        }));
      });

      test('delivers a single message.', async (): Promise<void> => {
        const message = { text: 'Hello world!' };

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          publishMessage({ message });
        }, 100);

        const data = await client.getMessages();

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo(message);
                resolve();
              }
            ],
            true
          ));
        });
      });

      test('delivers multiple messages.', async (): Promise<void> => {
        const messageFirst = { text: 'Hello world!' };
        const messageSecond = { text: 'Goodbye world!' };

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        setTimeout(async (): Promise<void> => {
          publishMessage({ message: messageFirst });
          publishMessage({ message: messageSecond });
        }, 100);

        const data = await client.getMessages();

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            [
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo(messageFirst);
              },
              (streamElement: any): void => {
                assert.that(streamElement).is.equalTo(messageSecond);
                resolve();
              }
            ],
            true
          ));
        });
      });
    });
  });
});
