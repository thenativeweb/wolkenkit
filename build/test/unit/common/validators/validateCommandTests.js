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
const Command_1 = require("../../../../lib/common/elements/Command");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const uuid_1 = require("uuid");
const validateCommand_1 = require("../../../../lib/common/validators/validateCommand");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('validateCommand', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const command = new Command_1.Command({
        aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
        },
        name: 'execute',
        data: {
            strategy: 'succeed'
        }
    });
    let application;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    test('does not throw an error if everything is fine.', async () => {
        assertthat_1.assert.that(() => {
            validateCommand_1.validateCommand({ command, application });
        }).is.not.throwing();
    });
    test(`throws an error if the command's context doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateCommand_1.validateCommand({
                command: {
                    ...command,
                    aggregateIdentifier: {
                        context: { name: 'someContext' },
                        aggregate: command.aggregateIdentifier.aggregate
                    }
                },
                application
            });
        }).is.throwing((ex) => ex.code === errors.ContextNotFound.code &&
            ex.message === `Context 'someContext' not found.`);
    });
    test(`throws an error if the command's aggregate doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateCommand_1.validateCommand({
                command: {
                    ...command,
                    aggregateIdentifier: {
                        context: command.aggregateIdentifier.context,
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
    test(`throws an error if the command doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateCommand_1.validateCommand({
                command: {
                    ...command,
                    name: 'someCommand'
                },
                application
            });
        }).is.throwing((ex) => ex.code === errors.CommandNotFound.code &&
            ex.message === `Command 'sampleContext.sampleAggregate.someCommand' not found.`);
    });
    test(`throws an error if the command's data doesn't match its schema.`, async () => {
        assertthat_1.assert.that(() => {
            validateCommand_1.validateCommand({
                command: {
                    ...command,
                    data: {
                        foo: ''
                    }
                },
                application
            });
        }).is.throwing((ex) => ex.code === errors.CommandMalformed.code &&
            ex.message === `Missing required property: strategy (at command.data.strategy).`);
    });
});
//# sourceMappingURL=validateCommandTests.js.map