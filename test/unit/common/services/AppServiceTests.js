'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { AppService } = require('../../../../common/services'),
      { EventInternal } = require('../../../../common/elements'),
      { InMemory } = require('../../../../stores/eventstore'),
      { Repository } = require('../../../../common/domain'),
      updateInitialState = require('../../../shared/applications/valid/updateInitialState');

suite('AppService', () => {
  let application,
      eventstore,
      repository;

  setup(async () => {
    const directory = await updateInitialState();

    eventstore = new InMemory();
    await eventstore.initialize();

    application = await Application.load({ directory });
    repository = new Repository({ application, eventstore });
  });

  teardown(async () => {
    await eventstore.destroy();
  });

  test('is a function.', async () => {
    assert.that(AppService).is.ofType('function');
  });

  test('throws an error if application is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AppService({
        repository,
        capabilities: { readAggregates: true }
      });
      /* eslint-enable no-new */
    }).is.throwing('Application is missing.');
  });

  test('throws an error if repository is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AppService({
        application,
        capabilities: { readAggregates: true }
      });
      /* eslint-enable no-new */
    }).is.throwing('Repository is missing.');
  });

  test('throws an error if capabilities are missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AppService({
        application,
        repository
      });
      /* eslint-enable no-new */
    }).is.throwing('Capabilities are missing.');
  });

  test('throws an error if no capabilities are requested.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new AppService({
        application,
        repository,
        capabilities: {}
      });
      /* eslint-enable no-new */
    }).is.throwing('At least one capability must be requested.');
  });

  suite('read aggregates', () => {
    let appService;

    setup(async () => {
      appService = new AppService({
        application,
        repository,
        capabilities: { readAggregates: true }
      });
    });

    test('provides the domain structure.', async () => {
      assert.that(appService.sampleContext).is.ofType('object');
      assert.that(appService.sampleContext.sampleAggregate).is.ofType('function');
    });

    suite('aggregate function', () => {
      test('throws an error if aggregate id is missing.', async () => {
        assert.that(() => {
          appService.sampleContext.sampleAggregate();
        }).is.throwing('Aggregate id is missing.');
      });

      test('returns an aggregate.', async () => {
        const aggregate = appService.sampleContext.sampleAggregate(uuid());

        assert.that(aggregate).is.ofType('object');
      });

      suite('read', () => {
        test('throws an error if the aggregate could not be found.', async () => {
          await assert.that(async () => {
            await appService.sampleContext.sampleAggregate(uuid()).read();
          }).is.throwingAsync('Aggregate not found.');
        });

        test('returns the requested aggregate.', async () => {
          const aggregateId = uuid();

          const succeeded = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'succeeded',
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              causationId: uuid(),
              correlationId: uuid(),
              revision: { aggregate: 1 }
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              causationId: uuid(),
              correlationId: uuid(),
              revision: { aggregate: 2 }
            },
            annotations: { state: {}, previousState: {}}
          });

          await eventstore.saveEvents({
            uncommittedEvents: [ succeeded, executed ]
          });

          const aggregate = await appService.sampleContext.sampleAggregate(aggregateId).read();

          assert.that(aggregate.id).is.equalTo(aggregateId);
          assert.that(aggregate.state).is.equalTo({
            events: [ 'succeeded', 'executed' ]
          });
          assert.that(aggregate.exists).is.ofType('function');
          assert.that(aggregate.exists()).is.true();
        });
      });
    });
  });
});
