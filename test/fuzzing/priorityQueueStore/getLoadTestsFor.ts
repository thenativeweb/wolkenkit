import { errors } from '../../../lib/stores/priorityQueueStore/Observer/PriorityQueueObserver';
import fs from 'fs';
import { getShortId } from '../../shared/getShortId';
import naughtyStrings from '../naughtyStrings';
import os from 'os';
import path from 'path';
import pForever from 'p-forever';
import { PriorityQueueObserver } from '../../../lib/stores/priorityQueueStore/Observer';
import { PriorityQueueStore } from '../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { range, sample } from 'lodash';

interface Item {
  id: string;
}

const getLogFile = function ({ queueType }: { queueType: string }): string {
  return path.join(os.tmpdir(), `pqueue-fuzzing-${queueType}-${Date.now()}.log`);
};

const generateRandomItem = function (): { item: Item; discriminator: string; priority: number } {
  return {
    priority: Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)),
    discriminator: `${sample(range(0, 10))}`,
    item: {
      id: sample(naughtyStrings)!
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
  test('priority queue store fuzzing.', async function (): Promise<void> {
    const overallExecutionTime = 3.6e6;
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
        2_000
    );

    const observedQueue = await createPriorityQueueStore({ suffix: getShortId(), expirationTime });
    const priorityQueueObserver = await PriorityQueueObserver.create({ observedQueue });

    await priorityQueueObserver.setup();
    let stopSignal = false;

    const insertItemWorker = async (): Promise<void> => {
      await priorityQueueObserver.enqueue(generateRandomItem());
    };
    const consumeItemWorker = async (): Promise<void> => {
      const cases = [
        'acknowledge',
        'defer',
        'die'
      ];
      const chosenCase = sample(cases);
      const iterationCount = sample(range(0, maxIterationCount + 1))!;
      const sleepInterval = Math.random() * maxSleepTime;
      const item = await priorityQueueObserver.lockNext();

      if (item === undefined) {
        return;
      }

      for (let currentIteration = 0; currentIteration < iterationCount; currentIteration++) {
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
              priority: Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)),
              ...item.metadata
            });
          };
          break;
        }
        default: {
          throw new Error('Invalid operation.');
        }
      }

      await operation();
      while (Math.random() < repeatAckOrDeferRate) {
        await operation();
      }
    };

    const promises = [
      pForever(async (): Promise<void | typeof pForever.end> => {
        if (stopSignal) {
          return pForever.end;
        }

        try {
          await insertItemWorker();
        } catch {
          // Intentionally left blank.
        }

        await sleep(Math.random() * maxInsertionDelay);
      }),
      ...Array.from({ length: workerCount }).fill(null).map(async (): Promise<void> => {
        await pForever(async (): Promise<void | typeof pForever.end> => {
          if (stopSignal) {
            return pForever.end;
          }

          try {
            await consumeItemWorker();
          } catch {
            // Intentionally left blank.
          }
          await sleep(Math.random() * maxSleepTime);
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
          case 'error': {
            throw new errors.ObserverError('An unexpected error occurred during fuzzing. This is a potential bug!', { data: data.data.ex });
          }
          default: {
            break;
          }
        }
      }
    })();

    setTimeout(async (): Promise<void> => {
      stopSignal = true;
    }, overallExecutionTime);

    await Promise.all(promises);
    await priorityQueueObserver.destroy();
    await observerStreamHandler;
  });
};

// eslint-disable-next-line mocha/no-exports
export { getLoadTestsFor };
