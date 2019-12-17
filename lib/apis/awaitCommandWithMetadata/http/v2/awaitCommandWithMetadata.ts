import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { RequestHandler } from 'express-serve-static-core';
import { Response } from 'express';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { writeLine } from '../../../../apis/base/writeLine';

const logger = flaschenpost.getLogger();

const maybeHandleLock = async function ({
  priorityQueueStore,
  res
}: {
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
  res: Response;
}): Promise<boolean> {
  const nextLock = await priorityQueueStore.lockNext();

  if (nextLock !== undefined) {
    logger.info('Locked priority queue item.', nextLock);

    writeLine({ res, data: nextLock });
    res.end();

    return true;
  }

  return false;
};

const awaitCommandWithMetadata = function ({
  priorityQueueStore,
  newCommandSubscriber,
  newCommandSubscriberChannel
}: {
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
  newCommandSubscriber: Subscriber<object>;
  newCommandSubscriberChannel: string;
}): RequestHandler {
  return async function (req, res): Promise<void> {
    const instantSuccess = await maybeHandleLock({ priorityQueueStore, res });

    if (instantSuccess) {
      return;
    }

    const callback = async function (): Promise<void> {
      const success = await maybeHandleLock({ priorityQueueStore, res });

      if (success) {
        await newCommandSubscriber.unsubscribe({
          channel: newCommandSubscriberChannel,
          callback
        });
      }
    };

    await newCommandSubscriber.subscribe({
      channel: newCommandSubscriberChannel,
      callback
    });
  };
};

export { awaitCommandWithMetadata };
