"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getSnapshotStrategy_1 = require("../../../../lib/common/domain/getSnapshotStrategy");
suite('getSnapshotStrategy', () => {
    suite('lowest', () => {
        test('returns true if the revision delta exceeds the limit.', async () => {
            const configuration = {
                durationLimit: 500,
                revisionLimit: 100
            };
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'lowest',
                configuration
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 200,
                replayedDomainEvents: 105
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.true();
        });
        test('returns true if the time delta exceeds the limit.', async () => {
            const configuration = {
                durationLimit: 500,
                revisionLimit: 100
            };
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'lowest',
                configuration
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 600,
                replayedDomainEvents: 50
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.true();
        });
        test('returns false if neither exceeds the limit.', async () => {
            const configuration = {
                durationLimit: 500,
                revisionLimit: 100
            };
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'lowest',
                configuration
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 250,
                replayedDomainEvents: 45
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.false();
        });
    });
    suite('revision', () => {
        test('returns true if the revision delta exceeds the limit.', async () => {
            const configuration = {
                revisionLimit: 100
            };
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'revision',
                configuration
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 200,
                replayedDomainEvents: 105
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.true();
        });
        test(`returns false if the revision delta doesn't exceed the limit.`, async () => {
            const configuration = {
                revisionLimit: 100
            };
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'revision',
                configuration
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 200,
                replayedDomainEvents: 37
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.false();
        });
    });
    suite('duration', () => {
        test('returns true if the duration exceeds the limit.', async () => {
            const configuration = {
                durationLimit: 100
            };
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'duration',
                configuration
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 200,
                replayedDomainEvents: 105
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.true();
        });
        test(`returns false if the duration doesn't exceed the limit.`, async () => {
            const configuration = {
                durationLimit: 100
            };
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'duration',
                configuration
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 68,
                replayedDomainEvents: 105
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.false();
        });
    });
    suite('never', () => {
        test('returns false.', async () => {
            const snapshotStrategy = getSnapshotStrategy_1.getSnapshotStrategy({
                name: 'never'
            });
            const shouldCreateSnapshot = snapshotStrategy({
                latestSnapshot: undefined,
                replayDuration: 200000,
                replayedDomainEvents: 10000
            });
            assertthat_1.assert.that(shouldCreateSnapshot).is.false();
        });
    });
});
//# sourceMappingURL=getSnapshotTimingStrategyTests.js.map