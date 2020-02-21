import { AeonstoreDomainEventStore } from '../../../../lib/stores/domainEventStore/Aeonstore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getAvailablePorts } from '../../../../lib/common/utils/network/getAvailablePorts';
import { getTestsFor } from './getTestsFor';
import { startProcess } from '../../../../lib/runtimes/shared/startProcess';

const processMap = new Map<string, () => Promise<void>>();

suite('Aeonstore', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: { suffix: string }): Promise<DomainEventStore> {
      const [ port, healthPort ] = await getAvailablePorts({ count: 2 });

      const stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'domainEventStore',
        enableDebugMode: false,
        port: healthPort,
        env: {
          PORT: String(port),
          HEALTH_PORT: String(healthPort)
        }
      });

      processMap.set(suffix, stopProcess);

      const aeonstoreDomainEventStore = await AeonstoreDomainEventStore.create({
        protocol: 'http',
        hostName: 'localhost',
        port,
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
