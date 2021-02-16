import { AeonstoreDomainEventStore } from '../../../../lib/stores/domainEventStore/Aeonstore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getSocketPaths } from '../../../shared/getSocketPaths';
import { getTestsFor } from './getTestsFor';
import { startProcess } from '../../../../lib/runtimes/shared/startProcess';

const processMap = new Map<string, () => Promise<void>>();

suite('Aeonstore', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: { suffix: string }): Promise<DomainEventStore> {
      const [ socket, healthSocket ] = await getSocketPaths({ count: 2 });

      const stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'domainEventStore',
        enableDebugMode: false,
        portOrSocket: healthSocket,
        env: {
          /* eslint-disable @typescript-eslint/naming-convention */
          PORT_OR_SOCKET: socket,
          HEALTH_PORT_OR_SOCKET: healthSocket
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      });

      processMap.set(suffix, stopProcess);

      const aeonstoreDomainEventStore = await AeonstoreDomainEventStore.create({
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: socket,
        path: '/'
      });

      return aeonstoreDomainEventStore;
    },
    async teardownDomainEventStore ({ suffix }: { suffix: string }): Promise<void> {
      const stopProcess = processMap.get(suffix);

      if (stopProcess === undefined) {
        return;
      }

      await stopProcess();

      processMap.delete(suffix);
    }
  });
});
