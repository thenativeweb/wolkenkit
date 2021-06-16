"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const createSandbox_1 = require("../../../../lib/common/utils/test/sandbox/createSandbox");
const uuid_1 = require("uuid");
suite('javascript/base', () => {
    test('runs a command on a pristine aggregate.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        const aggregateIdentifier = {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
        };
        await createSandbox_1.createSandbox().
            withApplication({ application }).
            forAggregate({ aggregateIdentifier }).
            when({ name: 'execute', data: { strategy: 'succeed' } }).
            then(({ state, domainEvents }) => {
            assertthat_1.assert.that(domainEvents[0].name).is.equalTo('succeeded');
            assertthat_1.assert.that(domainEvents[1].name).is.equalTo('executed');
            assertthat_1.assert.that(state).is.equalTo({ domainEventNames: ['succeeded', 'executed'] });
        });
    });
    test('runs a command on a non-pristine aggregate.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        const aggregateIdentifier = {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
        };
        await createSandbox_1.createSandbox().
            withApplication({ application }).
            forAggregate({ aggregateIdentifier }).
            given({ name: 'succeeded', data: {} }).
            and({ name: 'executed', data: { strategy: 'succeed' } }).
            when({ name: 'execute', data: { strategy: 'succeed' } }).
            then(({ state, domainEvents }) => {
            assertthat_1.assert.that(domainEvents[0].name).is.equalTo('succeeded');
            assertthat_1.assert.that(domainEvents[1].name).is.equalTo('executed');
            assertthat_1.assert.that(state).is.equalTo({ domainEventNames: ['succeeded', 'executed', 'succeeded', 'executed'] });
        });
    });
});
//# sourceMappingURL=baseTests.js.map