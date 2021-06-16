"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestsFor = void 0;
const assertthat_1 = require("assertthat");
const getShortId_1 = require("../../../shared/getShortId");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createConsumerProgressStore }) {
    let aggregateIdentifier, consumerId, consumerProgressStore, suffix;
    setup(async () => {
        suffix = getShortId_1.getShortId();
        consumerProgressStore = await createConsumerProgressStore({ suffix });
        await consumerProgressStore.setup();
        aggregateIdentifier = {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
        };
        consumerId = uuid_1.v4();
    });
    teardown(async function () {
        this.timeout(20000);
        await consumerProgressStore.destroy();
    });
    suite('getProgress', () => {
        test('returns revision 0 and is replaying false for new consumers.', async () => {
            const progress = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(progress).is.equalTo({ revision: 0, isReplaying: false });
        });
        test('returns revision 0 and is replaying false for unknown aggregates.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier: {
                    context: aggregateIdentifier.context,
                    aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                },
                revision: 1
            });
            const progress = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(progress).is.equalTo({ revision: 0, isReplaying: false });
        });
        test('returns 0 and is replaying false for new consumers even if the aggregate is known to other consumers.', async () => {
            await consumerProgressStore.setProgress({
                consumerId: uuid_1.v4(),
                aggregateIdentifier,
                revision: 1
            });
            const progress = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(progress).is.equalTo({ revision: 0, isReplaying: false });
        });
        test('returns the revision for known aggregates.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 1
            });
            const { revision } = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(revision).is.equalTo(1);
        });
    });
    suite('setProgress', () => {
        test('sets the revision for new consumers.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 1
            });
            const { revision } = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(revision).is.equalTo(1);
        });
        test('sets the revision for new aggregates.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 1
            });
            const { revision } = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(revision).is.equalTo(1);
        });
        test('updates the revision for known aggregates.', async () => {
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
            assertthat_1.assert.that(revision).is.equalTo(2);
        });
        test('does not update the revision if the revision stayed the same.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 1
            });
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.setProgress({
                    consumerId,
                    aggregateIdentifier,
                    revision: 1
                });
            }).is.throwingAsync((ex) => ex.code === errors.RevisionTooLow.code);
        });
        test('does not update the revision if the revision decreased.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 2
            });
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.setProgress({
                    consumerId,
                    aggregateIdentifier,
                    revision: 1
                });
            }).is.throwingAsync((ex) => ex.code === errors.RevisionTooLow.code);
        });
        test('does not update the replaying state.', async () => {
            await consumerProgressStore.setIsReplaying({
                consumerId,
                aggregateIdentifier,
                isReplaying: { from: 7, to: 9 }
            });
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 2
            });
            const { isReplaying } = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(isReplaying).is.equalTo({ from: 7, to: 9 });
        });
        test('throws an error if the revision is below zero.', async () => {
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.setProgress({
                    consumerId,
                    aggregateIdentifier,
                    revision: -10
                });
            }).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code &&
                ex.message === 'Revision must be at least zero.');
        });
    });
    suite('setIsReplaying', () => {
        test('sets the is replaying value for new consumers.', async () => {
            await consumerProgressStore.setIsReplaying({
                consumerId,
                aggregateIdentifier,
                isReplaying: { from: 5, to: 7 }
            });
            const progress = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(progress).is.equalTo({
                revision: 0,
                isReplaying: { from: 5, to: 7 }
            });
        });
        test('sets the is replaying value for known aggregates.', async () => {
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
            assertthat_1.assert.that(progress).is.equalTo({
                revision: 1,
                isReplaying: { from: 7, to: 9 }
            });
        });
        test('throws an error if an aggregate is already replaying.', async () => {
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
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.setIsReplaying({
                    consumerId,
                    aggregateIdentifier,
                    isReplaying: { from: 2, to: 20 }
                });
            }).is.throwingAsync((ex) => ex.code === errors.FlowIsAlreadyReplaying.code);
        });
        test('does not change the revision when enabling replays.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 5
            });
            await consumerProgressStore.setIsReplaying({
                consumerId,
                aggregateIdentifier,
                isReplaying: { from: 7, to: 9 }
            });
            const { revision } = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(revision).is.equalTo(5);
        });
        test('does not change the revision when disabling replays.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 5
            });
            await consumerProgressStore.setIsReplaying({
                consumerId,
                aggregateIdentifier,
                isReplaying: false
            });
            const { revision } = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(revision).is.equalTo(5);
        });
        test('throws an error if replaying from is less than one.', async () => {
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.setIsReplaying({
                    consumerId,
                    aggregateIdentifier,
                    isReplaying: {
                        from: -5,
                        to: 5
                    }
                });
            }).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code &&
                ex.message === 'Replays must start from at least one.');
        });
        test('throws an error if replaying from has a higher value than replaying to.', async () => {
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.setIsReplaying({
                    consumerId,
                    aggregateIdentifier,
                    isReplaying: {
                        from: 15,
                        to: 5
                    }
                });
            }).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code &&
                ex.message === 'Replays must start at an earlier revision than where they end at.');
        });
    });
    suite('resetProgress', () => {
        test('resets the revision for the given consumer.', async () => {
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
            assertthat_1.assert.that(revision).is.equalTo(0);
        });
        test('stops an ongoing replay.', async () => {
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
            assertthat_1.assert.that(progress.isReplaying).is.false();
        });
        test('does not reset the revisions for other consumers.', async () => {
            const otherConsumerId = uuid_1.v4();
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
            assertthat_1.assert.that(revision).is.equalTo(1);
        });
        test('does not reset anything for an unknown consumer.', async () => {
            const otherConsumerId = uuid_1.v4();
            await consumerProgressStore.setProgress({
                consumerId: otherConsumerId,
                aggregateIdentifier,
                revision: 1
            });
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.resetProgress({ consumerId });
            }).is.not.throwingAsync();
        });
    });
    suite('resetProgressToRevision', () => {
        test('resets the revision to the given value.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 15
            });
            await consumerProgressStore.resetProgressToRevision({ consumerId, aggregateIdentifier, revision: 5 });
            const { revision } = await consumerProgressStore.getProgress({
                consumerId,
                aggregateIdentifier
            });
            assertthat_1.assert.that(revision).is.equalTo(5);
        });
        test('throws an error if the revision is less than zero.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 1
            });
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.resetProgressToRevision({
                    consumerId,
                    aggregateIdentifier,
                    revision: -5
                });
            }).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code &&
                ex.message === 'Revision must be at least zero.');
        });
        test('throws an error if the revision is larger than the current revision.', async () => {
            await consumerProgressStore.setProgress({
                consumerId,
                aggregateIdentifier,
                revision: 1
            });
            await assertthat_1.assert.that(async () => {
                await consumerProgressStore.resetProgressToRevision({
                    consumerId,
                    aggregateIdentifier,
                    revision: 15
                });
            }).is.throwingAsync((ex) => ex.code === errors.ParameterInvalid.code &&
                ex.message === 'Can not reset a consumer to a newer revision than it currently is at.');
        });
        test('stops an ongoing replay.', async () => {
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
            await consumerProgressStore.resetProgressToRevision({
                consumerId,
                aggregateIdentifier,
                revision: 0
            });
            const progress = await consumerProgressStore.getProgress({ consumerId, aggregateIdentifier });
            assertthat_1.assert.that(progress.isReplaying).is.false();
        });
    });
};
exports.getTestsFor = getTestsFor;
//# sourceMappingURL=getTestsFor.js.map