import { AeonstoreDomainEventStore } from '../../../../lib/stores/domainEventStore/Aeonstore';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getAvailablePorts } from '../../../../lib/common/utils/network/getAvailablePorts';
import { getTestsFor } from './getTestsFor';
import { startProcess } from '../../../shared/runtime/startProcess';

const processMap = new Map<string, () => Promise<void>>();

suite('Aeonstore', (): void => {
  getTestsFor({
    async createDomainEventStore ({ suffix }: { suffix: string }): Promise<DomainEventStore> {
      const [ port ] = await getAvailablePorts({ count: 1 });

      const stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'domainEventStore',
        port,
        env: {
          PORT: String(port)
        }
      });

      processMap.set(suffix, stopProcess);

      const aeonstoreDomainEventStore = await AeonstoreDomainEventStore.create({
        aeonstoreBaseUrl: `http://localhost:${port}`
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
