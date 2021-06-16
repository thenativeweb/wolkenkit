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
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const wolkenkit_1 = require("../../../../lib/wolkenkit");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const uuid_1 = require("uuid");
const validateDomainEventWithState_1 = require("../../../../lib/common/validators/validateDomainEventWithState");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('validateDomainEventWithState', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const user = {
        id: 'jane.doe',
        claims: { sub: 'jane.doe' }
    };
    const domainEvent = new wolkenkit_1.DomainEventWithState({
        ...buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
            },
            name: 'executed',
            data: {
                strategy: 'succeed'
            },
            metadata: {
                initiator: { user },
                revision: 1
            }
        }),
        state: {
            next: {},
            previous: {}
        }
    });
    let application;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    test('does not throw an error if everything is fine.', async () => {
        assertthat_1.assert.that(() => {
            validateDomainEventWithState_1.validateDomainEventWithState({ domainEvent, application });
        }).is.not.throwing();
    });
    test(`throws an error if the domainEvent's context doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateDomainEventWithState_1.validateDomainEventWithState({
                domainEvent: new wolkenkit_1.DomainEventWithState({
                    ...domainEvent,
                    aggregateIdentifier: {
                        context: { name: 'someContext' },
                        aggregate: domainEvent.aggregateIdentifier.aggregate
                    }
                }),
                application
            });
        }).is.throwing((ex) => ex.code === errors.ContextNotFound.code &&
            ex.message === `Context 'someContext' not found.`);
    });
    test(`throws an error if the domainEvent's aggregate doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateDomainEventWithState_1.validateDomainEventWithState({
                domainEvent: new wolkenkit_1.DomainEventWithState({
                    ...domainEvent,
                    aggregateIdentifier: {
                        context: domainEvent.aggregateIdentifier.context,
                        aggregate: {
                            name: 'someAggregate',
                            id: uuid_1.v4()
                        }
                    }
                }),
                application
            });
        }).is.throwing((ex) => ex.code === errors.AggregateNotFound.code &&
            ex.message === `Aggregate 'sampleContext.someAggregate' not found.`);
    });
    test(`throws an error if the domainEvent doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateDomainEventWithState_1.validateDomainEventWithState({
                domainEvent: new wolkenkit_1.DomainEventWithState({
                    ...domainEvent,
                    name: 'someDomainEvent'
                }),
                application
            });
        }).is.throwing((ex) => ex.code === errors.DomainEventNotFound.code &&
            ex.message === `Domain event 'sampleContext.sampleAggregate.someDomainEvent' not found.`);
    });
    test(`throws an error if the domainEvent's data doesn't match its schema.`, async () => {
        assertthat_1.assert.that(() => {
            validateDomainEventWithState_1.validateDomainEventWithState({
                domainEvent: new wolkenkit_1.DomainEventWithState({
                    ...domainEvent,
                    data: {
                        foo: ''
                    }
                }),
                application
            });
        }).is.throwing((ex) => ex.code === errors.DomainEventMalformed.code &&
            ex.message === `Missing required property: strategy (at domainEvent.data.strategy).`);
    });
});
//# sourceMappingURL=validateDomainEventWithStateTests.js.map