import { Configuration } from '../../../lib/runtimes/priority-queue-test/processes/priorityQueue/Configuration';
import { configurationDefinition } from '../../../lib/runtimes/priority-queue-test/processes/priorityQueue/configurationDefinition';
import { connectionOptions } from '../../shared/containers/connectionOptions';
import { getDefaultConfiguration } from '../../../lib/runtimes/shared/getDefaultConfiguration';
import { getShortId } from '../../shared/getShortId';
import { getSocketPaths } from '../../shared/getSocketPaths';
import { startProcess } from '../../../lib/runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../lib/runtimes/shared/toEnvironmentVariables';

suite('priorityQueueStore load test', function (): void {
  this.timeout(660_000);

  let priorityQueueHealthSocket: string,
      priorityQueueSocket: string,
      stopPriorityQueueProcess: (() => void) | undefined;

  setup(async (): Promise<void> => {
    [ priorityQueueSocket, priorityQueueHealthSocket ] = await getSocketPaths({ count: 2 });

    const configuration: Configuration = {
      ...getDefaultConfiguration({
        configurationDefinition
      }),
      missedItemRecoveryInterval: 600_000,
      portOrSocket: priorityQueueSocket,
      healthPortOrSocket: priorityQueueHealthSocket,
      priorityQueueStoreOptions: {
        type: 'MariaDb',
        expirationTime: 15_000,
        ...connectionOptions.mariaDb,
        tableNames: {
          priorityQueue: `priority_queue_${getShortId()}`,
          items: `items_${getShortId()}`
        }
      },
      crashHandlerTargetFile: '/tmp/crashlog'
    };

    stopPriorityQueueProcess = await startProcess({
      runtime: 'priority-queue-test',
      name: 'priorityQueue',
      enableDebugMode: false,
      portOrSocket: priorityQueueHealthSocket,
      env: {
        ...toEnvironmentVariables({
          configuration,
          configurationDefinition
        }),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        LOG_LEVEL: 'debug'
      }
    });
  });

  teardown(async (): Promise<void> => {
    if (stopPriorityQueueProcess) {
      stopPriorityQueueProcess();
    }

    stopPriorityQueueProcess = undefined;
  });

  test('does stuff?.', async (): Promise<void> => {
    console.log({ priorityQueueSocket, priorityQueueHealthSocket });
    await new Promise((resolve): any => setTimeout(resolve, 600_000));
  });
});
