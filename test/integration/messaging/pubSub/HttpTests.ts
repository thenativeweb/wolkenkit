import { getSocketPaths } from '../../../shared/getSocketPaths';
import { getTestsFor } from './getTestsFor';
import { HttpPublisher } from '../../../../lib/messaging/pubSub/Http/HttpPublisher';
import { HttpSubscriber } from '../../../../lib/messaging/pubSub/Http/HttpSubscriber';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { startProcess } from '../../../../lib/runtimes/shared/startProcess';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite('Http', (): void => {
  let healthSocket: string,
      socket: string,
      stopProcess: () => Promise<void>;

  suiteSetup(async (): Promise<void> => {
    [ socket, healthSocket ] = await getSocketPaths({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      portOrSocket: healthSocket,
      env: {
        /* eslint-disable @typescript-eslint/naming-convention */
        PORT_OR_SOCKET: socket,
        HEALTH_PORT_OR_SOCKET: healthSocket
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    });
  });

  suiteTeardown(async (): Promise<void> => {
    await stopProcess();
  });

  getTestsFor({
    async createPublisher<T extends object> (): Promise<Publisher<T>> {
      return await HttpPublisher.create({
        type: 'Http',
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: socket,
        path: '/publish/v2'
      });
    },
    async createSubscriber<T extends object> (): Promise<Subscriber<T>> {
      return await HttpSubscriber.create({
        type: 'Http',
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: socket,
        path: '/subscribe/v2'
      });
    }
  });
});
