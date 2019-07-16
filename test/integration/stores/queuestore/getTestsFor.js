'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { CommandInternal } = require('../../../../common/elements'),
      sleep = require('../../../../common/utils/sleep');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Queuestore, getOptions }) {
  let namespace,
      queuestore;

  setup(() => {
    queuestore = new Queuestore();
    namespace = uuid();
  });

  teardown(async function () {
    this.timeout(20 * 1000);

    await queuestore.destroy();
  });

  suite('initialize', function () {
    this.timeout(5 * 1000);

    test('does not throw an error if the database is reachable.', async () => {
      await assert.that(async () => {
        await queuestore.initialize({ ...getOptions(), namespace });
      }).is.not.throwingAsync();
    });

    test('does not throw an error if tables, indexes & co. do already exist.', async () => {
      await assert.that(async () => {
        await queuestore.initialize({ ...getOptions(), namespace });
        await queuestore.initialize({ ...getOptions(), namespace });
      }).is.not.throwingAsync();
    });
  });

  suite('enqueueItem', function () {
    this.timeout(5 * 1000);

    test('enqueues the given item.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await assert.that(async () => {
        await queuestore.getNextUnprocessedItem();
      }).is.throwingAsync('No unprocessed item found.');

      await queuestore.enqueueItem({ item: command });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();

      assert.that(unprocessedItem).is.equalTo(command);
      assert.that(uuid.is(token)).is.true();
    });
  });

  suite('getNextUnprocessedItem', function () {
    this.timeout(5 * 1000);

    test('throws an error if there are no queues.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      await assert.that(async () => {
        await queuestore.getNextUnprocessedItem();
      }).is.throwingAsync('No unprocessed item found.');
    });

    test('returns an item of an unprocessed queue.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();

      assert.that(unprocessedItem).is.equalTo(command);
      assert.that(uuid.is(token)).is.true();
    });

    test('returns the oldest item of an unprocessed queue.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const aggregateId = uuid();

      const firstCommand = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      const secondCommand = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: firstCommand });
      await queuestore.enqueueItem({ item: secondCommand });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();

      assert.that(unprocessedItem).is.equalTo(firstCommand);
      assert.that(uuid.is(token)).is.true();
    });

    test('locks the queue of the item that is returned.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const aggregateId = uuid();

      const firstCommand = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      const secondCommand = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: firstCommand });
      await queuestore.enqueueItem({ item: secondCommand });
      await queuestore.getNextUnprocessedItem();

      await assert.that(async () => {
        await queuestore.getNextUnprocessedItem();
      }).is.throwingAsync('No unprocessed item found.');
    });

    test('returns an item from the queue with the oldest unprocessed item.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const firstCommand = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      const secondCommand = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      secondCommand.metadata.timestamp = Date.now() - 100;

      await queuestore.enqueueItem({ item: firstCommand });
      await queuestore.enqueueItem({ item: secondCommand });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();

      assert.that(unprocessedItem).is.equalTo(secondCommand);
      assert.that(uuid.is(token)).is.true();
    });

    test('re-returns an item from an expired queue.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });
      await queuestore.getNextUnprocessedItem();

      const { processingDuration } = getOptions();

      await sleep({ ms: processingDuration + 100 });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();

      assert.that(unprocessedItem).is.equalTo(command);
      assert.that(uuid.is(token)).is.true();
    });
  });

  suite('extendItemProcessingTime', function () {
    this.timeout(5 * 1000);

    test('extends the item processing time.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();
      const { processingDuration } = getOptions();

      await sleep({ ms: processingDuration * 0.75 });
      await queuestore.extendItemProcessingTime({ item: unprocessedItem, token });
      await sleep({ ms: processingDuration * 0.75 });

      await assert.that(async () => {
        await queuestore.getNextUnprocessedItem();
      }).is.throwingAsync('No unprocessed item found.');
    });

    test('throws an error if the item does not exist.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      const token = uuid();

      await assert.that(async () => {
        await queuestore.extendItemProcessingTime({ item: command, token });
      }).is.throwingAsync('Item not found.');
    });

    test('throws an error if the item is not being processed.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const token = uuid();

      await assert.that(async () => {
        await queuestore.extendItemProcessingTime({ item: command, token });
      }).is.throwingAsync('Invalid token.');
    });

    test('does not throw an error if the item has expired, but the token is still valid.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();
      const { processingDuration } = getOptions();

      await sleep({ ms: processingDuration * 1.25 });

      await assert.that(async () => {
        await queuestore.extendItemProcessingTime({ item: unprocessedItem, token });
      }).is.not.throwingAsync();
    });

    test('throws an error if the token is invalid.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const { unprocessedItem } = await queuestore.getNextUnprocessedItem();
      const token = uuid();

      await assert.that(async () => {
        await queuestore.extendItemProcessingTime({ item: unprocessedItem, token });
      }).is.throwingAsync('Invalid token.');
    });
  });

  suite('dequeueItem', function () {
    this.timeout(5 * 1000);

    test('dequeues the item.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();

      await queuestore.dequeueItem({ item: unprocessedItem, token });

      await assert.that(async () => {
        await queuestore.getNextUnprocessedItem();
      }).is.throwingAsync('No unprocessed item found.');
    });

    test('throws an error if the item does not exist.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      const token = uuid();

      await assert.that(async () => {
        await queuestore.dequeueItem({ item: command, token });
      }).is.throwingAsync('Item not found.');
    });

    test('throws an error if the item is not being processed.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const token = uuid();

      await assert.that(async () => {
        await queuestore.dequeueItem({ item: command, token });
      }).is.throwingAsync('Invalid token.');
    });

    test('does not throw an error if the item has expired, but the token is still valid.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const { unprocessedItem, token } = await queuestore.getNextUnprocessedItem();
      const { processingDuration } = getOptions();

      await sleep({ ms: processingDuration * 1.25 });

      await assert.that(async () => {
        await queuestore.dequeueItem({ item: unprocessedItem, token });
      }).is.not.throwingAsync();
    });

    test('throws an error if the token is invalid.', async () => {
      await queuestore.initialize({ ...getOptions(), namespace });

      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          },
          initiator: {
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
          }
        }
      });

      await queuestore.enqueueItem({ item: command });

      const token = uuid();

      await assert.that(async () => {
        await queuestore.extendItemProcessingTime({ item: command, token });
      }).is.throwingAsync('Invalid token.');
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
