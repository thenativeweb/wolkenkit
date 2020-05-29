import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { getCommandWithMetadataSchema } from '../../../../common/schemas/getCommandWithMetadataSchema';
import { jsonSchema } from 'uuidv4';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Response } from 'express';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const logger = flaschenpost.getLogger();

const awaitCommandWithMetadata = {
  description: 'Sends the next available command.',
  path: '',

  request: {},
  response: {
    statusCodes: [ 200 ],

    stream: true,
    body: {
      type: 'object',
      properties: {
        item: getCommandWithMetadataSchema(),
        token: jsonSchema.v4
      },
      required: [ 'item', 'token' ],
      additionalProperties: false
    }
  },

  getHandler ({
    priorityQueueStore,
    newCommandSubscriber,
    newCommandSubscriberChannel,
    heartbeatInterval
  }: {
    priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
    newCommandSubscriber: Subscriber<object>;
    newCommandSubscriberChannel: string;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(awaitCommandWithMetadata.response.body);

    const maybeHandleLock = async function ({
      res
    }: {
      res: Response;
    }): Promise<boolean> {
      const nextLock = await priorityQueueStore.lockNext();

      if (nextLock !== undefined) {
        logger.info('Locked priority queue item.', nextLock);

        responseBodySchema.validate(nextLock);

        writeLine({ res, data: nextLock });
        res.end();

        return true;
      }

      return false;
    };

    return async function (req, res): Promise<void> {
      res.startStream({ heartbeatInterval });

      const instantSuccess = await maybeHandleLock({ res });

      if (instantSuccess) {
        return;
      }

      const callback = async function (): Promise<void> {
        const success = await maybeHandleLock({ res });

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
  }
};

export { awaitCommandWithMetadata };
