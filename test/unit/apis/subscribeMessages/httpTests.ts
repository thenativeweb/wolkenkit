import { Application } from 'express';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { AxiosError } from 'axios';
import { getApi } from '../../../../lib/apis/subscribeMessages/http';
import { PublishMessage } from '../../../../lib/apis/subscribeMessages/PublishMessage';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';

suite('subscribeMessages/http', (): void => {
  suite('/v2', (): void => {
    suite('GET /', function (): void {
      this.timeout(5_000);

      let api: Application,
          publishMessage: PublishMessage;

      setup(async (): Promise<void> => {
        ({ api, publishMessage } = await getApi({ corsOrigin: '*' }));
      });

      test('delivers a single message.', async (): Promise<void> => {
        const channel = 'messages',
              message = { text: 'Hello world!' };

        setTimeout(async (): Promise<void> => {
          publishMessage({ channel, message });
        }, 100);

        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: `/v2/${channel}`,
          responseType: 'stream'
        });

        await new Promise<void>((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement).is.equalTo(message);
              resolve();
            }
          ]));
        });
      });

      test('delivers multiple messages.', async (): Promise<void> => {
        const channel = 'messages',
              messageFirst = { text: 'Hello world!' },
              messageSecond = { text: 'Goodbye world!' };

        setTimeout(async (): Promise<void> => {
          publishMessage({ channel, message: messageFirst });
          publishMessage({ channel, message: messageSecond });
        }, 100);

        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: `/v2/${channel}`,
          responseType: 'stream'
        });

        await new Promise<void>((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream([
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement).is.equalTo(messageFirst);
            },
            (streamElement: any): void => {
              assert.that(streamElement).is.equalTo(messageSecond);
              resolve();
            }
          ]));
        });
      });

      test('gracefully handles connections that get closed by the client.', async (): Promise<void> => {
        const channel = 'messages',
              message = { text: 'Hello world!' };
        const { client } = await runAsServer({ app: api });

        try {
          await client({
            method: 'get',
            url: `/v2/${channel}`,
            responseType: 'stream',
            timeout: 100
          });
        } catch (ex: unknown) {
          if ((ex as AxiosError).code !== 'ECONNABORTED') {
            throw ex;
          }

          // Ignore aborted connections, since that's what we want to achieve
          // here.
        }

        await sleep({ ms: 50 });

        await assert.that(async (): Promise<void> => {
          publishMessage({ channel, message });
        }).is.not.throwingAsync();
      });
    });
  });
});
