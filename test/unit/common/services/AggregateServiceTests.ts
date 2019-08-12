import { AggregateService } from '../../../../src/common/services/AggregateService';
import Application from '../../../../src/common/application';
import assert from 'assertthat';
import EventInternal from '../../../../src/common/elements/EventInternal';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import getAggregateService from '../../../../src/common/services/getAggregateService';
import InMemoryEventstore from '../../../../src/stores/eventstore/InMemory';
import Repository from '../../../../src/common/domain/Repository';
import updateInitialState from '../../../shared/applications/valid/updateInitialState';
import uuid from 'uuidv4';

suite('aggregateService', (): void => {
  let application: Application,
      eventstore: Eventstore,
      repository: Repository;

  setup(async (): Promise<void> => {
    const directory = await updateInitialState();

    eventstore = new InMemoryEventstore();
    await eventstore.initialize();

    application = await Application.load({ directory });
    repository = new Repository({ application, eventstore });
  });

  teardown(async (): Promise<void> => {
    await eventstore.destroy();
  });

  suite('read aggregates', (): void => {
    let aggregateService: AggregateService;

    setup(async (): Promise<void> => {
      aggregateService = getAggregateService({
        application,
        repository
      });
    });

    test('provides the domain structure.', async (): Promise<void> => {
      assert.that(aggregateService.sampleContext).is.ofType('object');
      assert.that(aggregateService.sampleContext!.sampleAggregate).is.ofType('function');
    });

    suite('aggregate function', (): void => {
      test('returns an aggregate.', async (): Promise<void> => {
        const aggregate = aggregateService.sampleContext!.sampleAggregate!(uuid());

        assert.that(aggregate).is.ofType('object');
      });

      suite('read', (): void => {
        test('throws an error if the aggregate could not be found.', async (): Promise<void> => {
          await assert.that(async (): Promise<void> => {
            await aggregateService.sampleContext!.sampleAggregate!(uuid()).read();
          }).is.throwingAsync('Aggregate not found.');
        });

        test('returns the requested aggregate.', async (): Promise<void> => {
          const aggregateId = uuid();

          const succeeded = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
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
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
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

          const aggregate = await aggregateService.sampleContext!.sampleAggregate!(aggregateId).read();

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
