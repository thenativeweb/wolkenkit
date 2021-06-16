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
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const uuid_1 = require("uuid");
const validateItemIdentifier_1 = require("../../../../lib/common/validators/validateItemIdentifier");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('validateItemIdentifier', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const itemIdentifier = {
        aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
        },
        id: uuid_1.v4(),
        name: 'execute'
    };
    let application;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    test('does not throw an error if everything is fine.', async () => {
        assertthat_1.assert.that(() => {
            validateItemIdentifier_1.validateItemIdentifier({ itemIdentifier, application });
        }).is.not.throwing();
    });
    test(`throws an error if the item identifier's context doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateItemIdentifier_1.validateItemIdentifier({
                itemIdentifier: {
                    ...itemIdentifier,
                    aggregateIdentifier: {
                        context: { name: 'someContext' },
                        aggregate: itemIdentifier.aggregateIdentifier.aggregate
                    }
                },
                application
            });
        }).is.throwing((ex) => ex.code === errors.ContextNotFound.code &&
            ex.message === `Context 'someContext' not found.`);
    });
    test(`throws an error if the item identifier's aggregate doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateItemIdentifier_1.validateItemIdentifier({
                itemIdentifier: {
                    ...itemIdentifier,
                    aggregateIdentifier: {
                        context: itemIdentifier.aggregateIdentifier.context,
                        aggregate: {
                            name: 'someAggregate',
                            id: uuid_1.v4()
                        }
                    }
                },
                application
            });
        }).is.throwing((ex) => ex.code === errors.AggregateNotFound.code &&
            ex.message === `Aggregate 'sampleContext.someAggregate' not found.`);
    });
    test(`throws an error if the command identifier's name doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateItemIdentifier_1.validateItemIdentifier({
                itemIdentifier: {
                    ...itemIdentifier,
                    name: 'nonExistent'
                },
                application,
                itemType: 'command'
            });
        }).is.throwing((ex) => ex.code === errors.CommandNotFound.code &&
            ex.message === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
    });
    test(`throws an error if the domain event identifier's name doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateItemIdentifier_1.validateItemIdentifier({
                itemIdentifier: {
                    ...itemIdentifier,
                    name: 'nonExistent'
                },
                application,
                itemType: 'domain-event'
            });
        }).is.throwing((ex) => ex.code === errors.DomainEventNotFound.code &&
            ex.message === `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`);
    });
});
//# sourceMappingURL=validateItemIdentifierTests.js.map