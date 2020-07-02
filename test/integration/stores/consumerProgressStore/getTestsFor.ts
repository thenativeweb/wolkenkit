import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { assert } from 'assertthat';
import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { CustomError } from 'defekt';
import { getShortId } from '../../../shared/getShortId';
import { uuid } from 'uuidv4';

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createConsumerProgressStore }: {
  createConsumerProgressStore ({ suffix }: { suffix: string }): Promise<ConsumerProgressStore>;
}): void {
  let aggregateIdentifier: AggregateIdentifier,
      consumerId: string,
      consumerProgressStore: ConsumerProgressStore,
      suffix: string;

  setup(async (): Promise<void> => {
    suffix = getShortId();
    consumerProgressStore = await createConsumerProgressStore({ suffix });

    aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };
    consumerId = uuid();
  });

  teardown(async function (): Promise<void> {
    this.timeout(20_000);

    await consumerProgressStore.destroy();
  });

  suite('getProgress', (): void => {
    test('returns revision 0 and is replaying false for new consumers.', async (): Promise<void> => {
      const progress = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(progress).is.equalTo({ revision: 0, isReplaying: false });
    });

    test('returns revision 0 and is replaying false for unknown aggregates.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        revision: 1
      });

      const progress = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(progress).is.equalTo({ revision: 0, isReplaying: false });
    });

    test('returns 0 and is replaying false for new consumers even if the aggregate is known to other consumers.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId: uuid(),
        aggregateIdentifier,
        revision: 1
      });

      const progress = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(progress).is.equalTo({ revision: 0, isReplaying: false });
    });

    test('returns the revision for known aggregates.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      const { revision } = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(revision).is.equalTo(1);
    });
  });

  suite('setProgress', (): void => {
    test('sets the revision for new consumers.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      const { revision } = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(revision).is.equalTo(1);
    });

    test('sets the revision for new aggregates.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      const { revision } = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(revision).is.equalTo(1);
    });

    test('updates the revision for known aggregates.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 2
      });

      const { revision } = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(revision).is.equalTo(2);
    });

    test('does not update the revision if the revision stayed the same.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      await assert.that(async (): Promise<void> => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1
        });
      }).is.throwingAsync((ex): boolean => (ex as CustomError).code === 'EREVISIONTOOLOW');
    });

    test('does not update the revision if the revision decreased.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 2
      });

      await assert.that(async (): Promise<void> => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1
        });
      }).is.throwingAsync((ex): boolean => (ex as CustomError).code === 'EREVISIONTOOLOW');
    });
  });

  suite('resetProgress', (): void => {
    test('resets the revisions for the given consumer.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      await consumerProgressStore.resetProgress({ consumerId });

      const { revision } = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(revision).is.equalTo(0);
    });

    test('stops an ongoing replay.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });
      await consumerProgressStore.setIsReplaying({
        consumerId,
        aggregateIdentifier,
        isReplaying: { from: 5, to: 7 }
      });

      await consumerProgressStore.resetProgress({ consumerId });

      const progress = await consumerProgressStore.getProgress({ consumerId, aggregateIdentifier });

      assert.that(progress.isReplaying).is.false();
    });

    test('does not reset the revisions for other consumers.', async (): Promise<void> => {
      const otherConsumerId = uuid();

      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      await consumerProgressStore.setProgress({
        consumerId: otherConsumerId,
        aggregateIdentifier,
        revision: 1
      });

      await consumerProgressStore.resetProgress({ consumerId });

      const { revision } = await consumerProgressStore.getProgress({
        consumerId: otherConsumerId,
        aggregateIdentifier
      });

      assert.that(revision).is.equalTo(1);
    });

    test('does not reset anything for an unknown consumer.', async (): Promise<void> => {
      const otherConsumerId = uuid();

      await consumerProgressStore.setProgress({
        consumerId: otherConsumerId,
        aggregateIdentifier,
        revision: 1
      });

      await assert.that(async (): Promise<void> => {
        await consumerProgressStore.resetProgress({ consumerId });
      }).is.not.throwingAsync();
    });
  });

  suite('setIsReplaying', (): void => {
    test('sets the is replaying value for new consumers.', async (): Promise<void> => {
      await consumerProgressStore.setIsReplaying({
        consumerId,
        aggregateIdentifier,
        isReplaying: { from: 5, to: 7 }
      });

      const progress = await consumerProgressStore.getProgress({
        consumerId,
        aggregateIdentifier
      });

      assert.that(progress).is.equalTo({
        revision: 0,
        isReplaying: { from: 5, to: 7 }
      });
    });

    test('sets the is replaying value for known aggregates.', async (): Promise<void> => {
      await consumerProgressStore.setProgress({
        consumerId,
        aggregateIdentifier,
        revision: 1
      });

      await consumerProgressStore.setIsReplaying({
        consumerId,
        aggregateIdentifier,
        isReplaying: { from: 7, to: 9 }
      });

      const progress = await consumerProgressStore.getProgress({ consumerId, aggregateIdentifier });

      assert.that(progress).is.equalTo({
        revision: 1,
        isReplaying: { from: 7, to: 9 }
      });
    });
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
