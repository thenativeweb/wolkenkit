'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Eventstore, type }) {
  let eventstore;

  setup(() => {
    eventstore = new Eventstore();
  });

  test('is a function.', async () => {
    assert.that(Eventstore).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      assert.that(eventstore.initialize).is.ofType('function');
    });

    if (type !== 'InMemory') {
      test('throws an error if hostname is missing.', async () => {
        await assert.that(async () => {
          await eventstore.initialize({
            port: 3000,
            username: 'wolkenkit',
            password: 'wolkenkit',
            database: 'wolkenkit'
          });
        }).is.throwingAsync('Hostname is missing.');
      });

      test('throws an error if port is missing.', async () => {
        await assert.that(async () => {
          await eventstore.initialize({
            hostname: 'localhost',
            username: 'wolkenkit',
            password: 'wolkenkit',
            database: 'wolkenkit'
          });
        }).is.throwingAsync('Port is missing.');
      });

      test('throws an error if username is missing.', async () => {
        await assert.that(async () => {
          await eventstore.initialize({
            hostname: 'localhost',
            port: 3000,
            password: 'wolkenkit',
            database: 'wolkenkit'
          });
        }).is.throwingAsync('Username is missing.');
      });

      test('throws an error if password is missing.', async () => {
        await assert.that(async () => {
          await eventstore.initialize({
            hostname: 'localhost',
            port: 3000,
            username: 'wolkenkit',
            database: 'wolkenkit'
          });
        }).is.throwingAsync('Password is missing.');
      });

      test('throws an error if database is missing.', async () => {
        await assert.that(async () => {
          await eventstore.initialize({
            hostname: 'localhost',
            port: 3000,
            username: 'wolkenkit',
            password: 'wolkenkit'
          });
        }).is.throwingAsync('Database is missing.');
      });
    }
  });

  suite('getLastEvent', () => {
    test('is a function.', async () => {
      assert.that(eventstore.getLastEvent).is.ofType('function');
    });

    test('throws an error if aggregate id is missing.', async () => {
      await assert.that(async () => {
        await eventstore.getLastEvent();
      }).is.throwingAsync('Aggregate id is missing.');
    });
  });

  suite('getEventStream', () => {
    test('is a function.', async () => {
      assert.that(eventstore.getEventStream).is.ofType('function');
    });

    test('throws an error if aggregate id is missing.', async () => {
      await assert.that(async () => {
        await eventstore.getEventStream({});
      }).is.throwingAsync('Aggregate id is missing.');
    });

    test('throws an error if from revision is greater than to revision.', async () => {
      await assert.that(async () => {
        await eventstore.getEventStream({ aggregateId: uuid(), fromRevision: 42, toRevision: 23 });
      }).is.throwingAsync('From revision is greater than to revision.');
    });
  });

  suite('getUnpublishedEventStream', () => {
    test('is a function.', async () => {
      assert.that(eventstore.getUnpublishedEventStream).is.ofType('function');
    });
  });

  suite('saveEvents', () => {
    test('is a function.', async () => {
      assert.that(eventstore.saveEvents).is.ofType('function');
    });

    test('throws an error if uncommitted events are missing.', async () => {
      await assert.that(async () => {
        await eventstore.saveEvents({});
      }).is.throwingAsync('Uncommitted events are missing.');
    });
  });

  suite('markEventsAsPublished', () => {
    test('is a function.', async () => {
      assert.that(eventstore.markEventsAsPublished).is.ofType('function');
    });

    test('throws an error if aggregate id is missing.', async () => {
      await assert.that(async () => {
        await eventstore.markEventsAsPublished({});
      }).is.throwingAsync('Aggregate id is missing.');
    });

    test('throws an error if from revision is missing.', async () => {
      await assert.that(async () => {
        await eventstore.markEventsAsPublished({ aggregateId: uuid() });
      }).is.throwingAsync('From revision is missing.');
    });

    test('throws an error if to revision is missing.', async () => {
      await assert.that(async () => {
        await eventstore.markEventsAsPublished({ aggregateId: uuid(), fromRevision: 5 });
      }).is.throwingAsync('To revision is missing.');
    });
  });

  suite('getSnapshot', () => {
    test('is a function.', async () => {
      assert.that(eventstore.getSnapshot).is.ofType('function');
    });

    test('throws an error if aggregate id is missing.', async () => {
      await assert.that(async () => {
        await eventstore.getSnapshot();
      }).is.throwingAsync('Aggregate id is missing.');
    });
  });

  suite('saveSnapshot', () => {
    test('is a function.', async () => {
      assert.that(eventstore.saveSnapshot).is.ofType('function');
    });

    test('throws an error if aggregate id is missing.', async () => {
      await assert.that(async () => {
        await eventstore.saveSnapshot({});
      }).is.throwingAsync('Aggregate id is missing.');
    });

    test('throws an error if revision is missing.', async () => {
      await assert.that(async () => {
        await eventstore.saveSnapshot({ aggregateId: uuid() });
      }).is.throwingAsync('Revision is missing.');
    });

    test('throws an error if state is missing.', async () => {
      await assert.that(async () => {
        await eventstore.saveSnapshot({ aggregateId: uuid(), revision: 10 });
      }).is.throwingAsync('State is missing.');
    });
  });

  suite('getReplay', () => {
    test('is a function.', async () => {
      assert.that(eventstore.getReplay).is.ofType('function');
    });

    test('throws an error if fromPosition is greater than toPosition.', async () => {
      await assert.that(async () => {
        await eventstore.getReplay({ fromPosition: 23, toPosition: 7 });
      }).is.throwingAsync('From position is greater than to position.');
    });
  });

  suite('destroy', () => {
    test('is a function.', async () => {
      assert.that(eventstore.destroy).is.ofType('function');
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
