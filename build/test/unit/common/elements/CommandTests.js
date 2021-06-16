"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const Command_1 = require("../../../../lib/common/elements/Command");
const uuid_1 = require("uuid");
suite('Command', () => {
    test('sets the given values.', async () => {
        const aggregateId = uuid_1.v4();
        const command = new Command_1.Command({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'sampleCommand',
            data: {
                strategy: 'succeed'
            }
        });
        assertthat_1.assert.that(command).is.equalTo({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'sampleCommand',
            data: {
                strategy: 'succeed'
            }
        });
    });
});
//# sourceMappingURL=CommandTests.js.map