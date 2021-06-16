"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseAggregate_1 = require("../../../../lib/common/parsers/parseAggregate");
suite('parseAggregate', () => {
    /* eslint-disable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-useless-constructor */
    class AggregateState {
        constructor() {
            // Intentionally left blank.
        }
    }
    /* eslint-enable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-useless-constructor */
    const aggregateDefinition = {
        getInitialState: () => new AggregateState(),
        commandHandlers: {},
        domainEventHandlers: {}
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({ aggregate: aggregateDefinition })).is.not.anError();
    });
    test('returns an error if getInitialState is missing.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                getInitialState: undefined
            }
        })).is.anErrorWithMessage(`Function 'getInitialState' is missing.`);
    });
    test('returns an error if getInitialState is not a function.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                getInitialState: {}
            }
        })).is.anErrorWithMessage(`Property 'getInitialState' is not a function.`);
    });
    test('returns an error if the command handlers are missing.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                commandHandlers: undefined
            }
        })).is.anErrorWithMessage(`Object 'commandHandlers' is missing.`);
    });
    test('returns an error if the command handlers are not an object.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                commandHandlers: false
            }
        })).is.anErrorWithMessage(`Property 'commandHandlers' is not an object.`);
    });
    test('returns an error if a malformed command handler is found.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                commandHandlers: {
                    sampleCommand: false
                }
            }
        })).is.anErrorWithMessage(`Command handler 'sampleCommand' is malformed: Property 'commandHandler' is not an object.`);
    });
    test('returns an error if the domain event handlers are missing.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                domainEventHandlers: undefined
            }
        })).is.anErrorWithMessage(`Object 'domainEventHandlers' is missing.`);
    });
    test('returns an error if the domain event handlers are not an object.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                domainEventHandlers: false
            }
        })).is.anErrorWithMessage(`Property 'domainEventHandlers' is not an object.`);
    });
    test('returns an error if a malformed domain event handler is found.', async () => {
        assertthat_1.assert.that(parseAggregate_1.parseAggregate({
            aggregate: {
                ...aggregateDefinition,
                domainEventHandlers: {
                    sampleDomainEvent: false
                }
            }
        })).is.anErrorWithMessage(`Domain event handler 'sampleDomainEvent' is malformed: Property 'domainEventHandler' is not an object.`);
    });
});
//# sourceMappingURL=parseAggregateTests.js.map