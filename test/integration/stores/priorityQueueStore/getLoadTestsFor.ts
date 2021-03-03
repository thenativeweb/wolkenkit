import { errors } from '../../../../lib/stores/priorityQueueStore/Observer/PriorityQueueObserver';
import fs from 'fs';
import { getShortId } from '../../../shared/getShortId';
import pForever from 'p-forever';
import { PriorityQueueObserver } from '../../../../lib/stores/priorityQueueStore/Observer';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { v4 } from 'uuid';
import { range, sample } from 'lodash';

interface Item {
  id: string;
}

const getLogFile = function ({ queueType }: { queueType: string }): string {
  return `/tmp/pqueue-fuzzing-${queueType}-${Date.now()}.log`;
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

const getLoadTestsFor = function ({ createPriorityQueueStore, queueType }: {
  createPriorityQueueStore: ({ suffix, expirationTime }: {
    suffix: string;
    expirationTime: number;
  }) => Promise<PriorityQueueStore<Item, any>>;
  queueType: string;
}): void {
  test('priorityQueueStore fuzzing.', async function (): Promise<void> {
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
    const observedQueue = await createPriorityQueueStore({ suffix: getShortId(), expirationTime });
    const priorityQueueObserver = await PriorityQueueObserver.create({ observedQueue });

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
      const logFileStream = fs.createWriteStream(getLogFile({ queueType }), {
        flags: 'w',
        encoding: 'utf-8'
      });

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
};

// eslint-disable-next-line mocha/no-exports
export { getLoadTestsFor };
