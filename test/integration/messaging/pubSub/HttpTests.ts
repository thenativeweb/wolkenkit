import { getAvailablePorts } from '../../../../lib/common/utils/network/getAvailablePorts';
import { getTestsFor } from './getTestsFor';
import { HttpPublisher } from '../../../../lib/messaging/pubSub/Http/HttpPublisher';
import { HttpSubscriber } from '../../../../lib/messaging/pubSub/Http/HttpSubscriber';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { startProcess } from '../../../../lib/runtimes/shared/startProcess';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite.only('Http', (): void => {
  let healthPort: number,
      port: number,
      stopProcess: () => Promise<void>;

  suiteSetup(async (): Promise<void> => {
    [ port, healthPort ] = await getAvailablePorts({ count: 2 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: healthPort,
      env: {
        PORT: String(port),
        HEALTH_PORT: String(healthPort)
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
        port,
        path: '/publish/v2'
      });
    },
    async createSubscriber<T extends object> (): Promise<Subscriber<T>> {
      return await HttpSubscriber.create({
        type: 'Http',
        protocol: 'http',
        hostName: 'localhost',
        port,
        path: '/subscribe/v2'
      });
    }
  });
});
