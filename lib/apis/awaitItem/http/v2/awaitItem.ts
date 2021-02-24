import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { isCustomError } from 'defekt';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Schema } from '../../../../common/elements/Schema';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const logger = flaschenpost.getLogger();

const awaitItem = {
  description: 'Sends the next available item.',
  path: '',

  request: {},
  response: {
    statusCodes: [ 200 ],

    stream: true,
    body: {
      type: 'object',
      properties: {
        item: {},
        metadata: {
          type: 'object',
          properties: {
            discriminator: { type: 'string', minLength: 1 },
            token: { type: 'string', format: 'uuid' }
          },
          required: [ 'discriminator', 'token' ],
          additionalProperties: false
        }
      },
      required: [ 'item', 'metadata' ],
      additionalProperties: false
    } as Schema
  },

  getHandler <TItem extends object>({
    priorityQueueStore,
    newItemSubscriber,
    newItemSubscriberChannel,
    validateOutgoingItem,
    heartbeatInterval
  }: {
    priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
    newItemSubscriber: Subscriber<object>;
    newItemSubscriberChannel: string;
    validateOutgoingItem: ({ item }: { item: TItem }) => void | Promise<void>;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(awaitItem.response.body);

    return async function (req, res): Promise<void> {
      try {
        res.startStream({ heartbeatInterval });

        const onNewItem = async function (): Promise<void> {
          try {
            const itemLock = await priorityQueueStore.lockNext();

            if (itemLock) {
              logger.debug(
                'Locked priority queue item.',
                withLogMetadata('api', 'awaitItem', { nextLock: itemLock })
              );

              await validateOutgoingItem({ item: itemLock.item });
              responseBodySchema.validate(itemLock, { valueName: 'responseBody' });

              writeLine({ res, data: itemLock });

              await newItemSubscriber.unsubscribe({
                channel: newItemSubscriberChannel,
                callback: onNewItem
              });
              res.end();
            }
          } catch (ex: unknown) {
            logger.error(
              'An unexpected error occured when locking an item.',
              withLogMetadata('api', 'awaitItem', { err: ex })
            );

            await newItemSubscriber.unsubscribe({
              channel: newItemSubscriberChannel,
              callback: onNewItem
            });
            res.end();
          }
        };

        await onNewItem();

        await newItemSubscriber.subscribe({
          channel: newItemSubscriberChannel,
          callback: onNewItem
        });
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.ContentTypeMismatch.code: {
            res.status(415).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'awaitItem', { err: ex })
            );

            res.status(500).json({
              code: error.code,
              message: error.message
            });
          }
        }
      }
    };
  }
};

export { awaitItem };
