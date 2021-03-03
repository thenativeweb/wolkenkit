import { connectionOptions } from '../../shared/containers/connectionOptions';
import fs from 'fs';
import { getShortId } from '../../shared/getShortId';
import pForever from 'p-forever';
import { PriorityQueueObserver } from '../../../lib/stores/priorityQueueStore/Observer';
import { PriorityQueueStoreOptions } from '../../../lib/stores/priorityQueueStore/PriorityQueueStoreOptions';
import { v4 } from 'uuid';
import { errors, PriorityQueueObserverOptions } from '../../../lib/stores/priorityQueueStore/Observer/PriorityQueueObserver';
import { range, sample } from 'lodash';

interface Item {
  id: string;
}

const getLogFile = function ({ observedQueueOptions }: PriorityQueueObserverOptions<Item, any>): string {
  return `/tmp/pqueue-fuzzing-${observedQueueOptions.type}-${Date.now()}.log`;
};

const generateRandomItem = function (): { item: Item; discriminator: string; priority: number } {
  return {
    priority: Math.random() * (Number.MAX_SAFE_INTEGER - 1),
    discriminator: `${sample(range(0, 10))}`,
    item: {
      id: v4()
    }
  };
};

const sleep = async function (ms: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout(resolve, ms);
  });
};

suite.only('priorityQueueStore fuzzing', function (): void {
  const overallExecutionTime = 100_000;
  const expirationTime = 2_000;
  const maxInsertionDelay = 100;
  const workerCount = 8;
  const maxIterationCount = 4;
  const renewFailureRate = 0.2;
  const repeatAckOrDeferRate = 0.2;
  const maxSleepTime = (1 / (1 - renewFailureRate)) * expirationTime;

  this.timeout(
    overallExecutionTime +
      maxInsertionDelay +
      (maxSleepTime * maxIterationCount) +
      1_000
  );

  test('MariaDb.', async (): Promise<void> => {
    const priorityQueueStoreOptions: PriorityQueueStoreOptions<Item, any> = {
      type: 'MariaDb',
      expirationTime,
      ...connectionOptions.mariaDb,
      tableNames: {
        priorityQueue: `priority_queue_${getShortId()}`,
        items: `items_${getShortId()}`
      },
      doesIdentifierMatchItem (): boolean {
        return false;
      }
    };
    const priorityQueueObserverOptions: PriorityQueueObserverOptions<Item, any> = {
      type: 'observer',
      observedQueueOptions: priorityQueueStoreOptions
    };
    const priorityQueueObserver = await PriorityQueueObserver.create(priorityQueueObserverOptions);

    await priorityQueueObserver.setup();
    let plsStop = false;

    const insertItem = async (): Promise<void> => {
      await priorityQueueObserver.enqueue(generateRandomItem());
    };
    const consumeItem = async (id: number): Promise<void> => {
      const cases = [
        'acknowledge',
        'defer',
        'die'
      ];
      const chosenCase = sample(cases);
      const iterationCount = sample(range(0, maxIterationCount + 1))!;
      const sleepInterval = Math.random() * maxSleepTime;
      const item = await priorityQueueObserver.lockNext();

      if (plsStop) {
        console.log('Random values:', { id, iterationCount, sleepInterval });
      }

      if (item === undefined) {
        return;
      }

      for (let currentIteration = 0; currentIteration < iterationCount; currentIteration++) {
        if (plsStop) {
          console.log('Idling...:', { id, currentIteration });
        }
        await sleep(sleepInterval);
        await priorityQueueObserver.renewLock(item.metadata);
      }

      if (chosenCase === 'die') {
        return;
      }

      let operation;

      switch (chosenCase) {
        case 'acknowledge': {
          operation = async (): Promise<void> => {
            await priorityQueueObserver.acknowledge(item.metadata);
          };
          break;
        }
        case 'defer': {
          operation = async (): Promise<void> => {
            await priorityQueueObserver.defer({
              priority: Math.random() * (Number.MAX_SAFE_INTEGER - 1),
              ...item.metadata
            });
          };
          break;
        }
        default: {
          throw new Error('Invalid operation.');
        }
      }

      if (plsStop) {
        console.log('Executing operation...:', { id, chosenCase });
      }

      await operation();
      let retries = 0;

      while (Math.random() < repeatAckOrDeferRate) {
        retries += 1;
        if (plsStop) {
          console.log(`Retrying...:`, { id, retries });
        }
        await operation();
      }
    };

    const promises = [
      pForever(async (): Promise<void | typeof pForever.end> => {
        if (plsStop) {
          console.log('Stopping insert item loop...');

          return pForever.end;
        }

        await insertItem();
        await sleep(Math.random() * maxInsertionDelay);
      }),
      ...Array.from({ length: workerCount }).fill(null).map(async (value, index): Promise<void> => {
        await pForever(async (): Promise<void | typeof pForever.end> => {
          if (plsStop) {
            console.log('Stopping consume item loop...', { index });

            return pForever.end;
          }

          try {
            await consumeItem(index);
          } catch {
          // Ignore.
          }
        });
      })
    ];

    const observerStreamHandler = (async (): Promise<void> => {
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

      console.log('Observer stream has ended.');
    })();

    setTimeout(async (): Promise<void> => {
      console.log('Sending stop signal...');
      plsStop = true;
    }, overallExecutionTime);

    await Promise.all(promises);
    await priorityQueueObserver.destroy();
    await observerStreamHandler;
  });
});
