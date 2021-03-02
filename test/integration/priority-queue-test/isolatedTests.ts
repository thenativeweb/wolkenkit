import { connectionOptions } from '../../shared/containers/connectionOptions';
import fs from 'fs';
import { getShortId } from '../../shared/getShortId';
import { PriorityQueueObserver } from '../../../lib/stores/priorityQueueStore/Observer';
import { PriorityQueueStoreOptions } from '../../../lib/stores/priorityQueueStore/PriorityQueueStoreOptions';
import { v4 } from 'uuid';
import { errors, HeapItem, Item, ObservableItem, PriorityQueueObserverOptions } from '../../../lib/stores/priorityQueueStore/Observer/PriorityQueueObserver';
import { range, sample } from 'lodash';

const getLogFile = function ({ observedQueueOptions }: PriorityQueueObserverOptions): string {
  return `/tmp/pqueue-fuzzing-${observedQueueOptions.type}-${Date.now()}.log`;
};

const generateRandomItem = function (): HeapItem<Item> {
  return {
    priority: Math.random() * (Number.MAX_SAFE_INTEGER - 1),
    discriminator: `${sample(range(0, 10))}`,
    item: {
      id: v4()
    }
  };
};

suite.only('priorityQueueStore fuzzing', function (): void {
  const overallExecutionTime = 300_000;
  const maxExecutionTime = 10_000;
  const maxInsertionDelay = 100;
  const workerParallelism = 8;
  const renewFailureRate = 0.2;

  this.timeout(overallExecutionTime + maxExecutionTime + 1_000);

  test('MariaDb.', async (): Promise<void> => {
    const priorityQueueStoreOptions: PriorityQueueStoreOptions<ObservableItem, any> = {
      type: 'MariaDb',
      expirationTime: 5_000,
      ...connectionOptions.mariaDb,
      tableNames: {
        priorityQueue: `priority_queue_${getShortId()}`,
        items: `items_${getShortId()}`
      },
      doesIdentifierMatchItem (): boolean {
        return false;
      }
    };
    const priorityQueueObserverOptions: PriorityQueueObserverOptions = {
      type: 'observer',
      observedQueueOptions: priorityQueueStoreOptions
    };
    const priorityQueueObserver = await PriorityQueueObserver.create(priorityQueueObserverOptions);

    await priorityQueueObserver.setup();
    let plsStop = false;

    setTimeout(async (): Promise<void> => {
      plsStop = true;
      await priorityQueueObserver.destroy();
    }, overallExecutionTime);

    const insertItem = async (): Promise<void> => {
      await priorityQueueObserver.enqueue(generateRandomItem());
      if (!plsStop) {
        setTimeout(insertItem, Math.random() * maxInsertionDelay);
      }
    };
    const consumeItem = async (): Promise<void> => {
      const cases = [
        'acknowledge',
        'defer',
        'die'
      ];
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const reScheduleSelf = (): void => {
        if (!plsStop) {
          setTimeout(consumeItem, 333);
        }
      };
      const chosenCase = sample(cases);
      const executionTime = Math.random() * maxExecutionTime;
      const failToRenew = Math.random() < renewFailureRate;
      const item = await priorityQueueObserver.lockNext();

      if (item === undefined) {
        return reScheduleSelf();
      }

      const startTime = Date.now();

      while (Date.now() - startTime < executionTime) {
        // Computer do computy things
        await new Promise((resolve): void => {
          setTimeout(resolve, 100);
        });
        if (!failToRenew) {
          await priorityQueueObserver.renewLock(item.metadata);
        }
      }

      switch (chosenCase) {
        case 'acknowledge': {
          await priorityQueueObserver.acknowledge(item.metadata);
          break;
        }
        case 'defer': {
          await priorityQueueObserver.defer({
            priority: Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ...item.metadata
          });
          break;
        }
        case 'die':
        default: {
          break;
        }
      }

      return reScheduleSelf();
    };

    await insertItem();
    const workers = [];

    for (let i = 0; i < workerParallelism; i++) {
      workers.push(consumeItem());
    }
    await Promise.all(workers);

    const logFileStream = fs.createWriteStream(getLogFile(priorityQueueObserverOptions), { flags: 'w', encoding: 'utf-8' });

    for await (const data of priorityQueueObserver.getEvents()) {
      logFileStream.write(JSON.stringify(data), 'utf-8');
      switch (data.type) {
        case 'issue': {
          console.log(data);
          break;
        }
        case 'error': {
          throw new errors.ObserverError('Well that was shit', { data: data.data.ex });
        }
        default: {
          break;
        }
      }
    }
  });
});
