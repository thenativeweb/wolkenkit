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
exports.parseReplayConfiguration = void 0;
const validate_value_1 = require("validate-value");
const defekt_1 = require("defekt");
const errors = __importStar(require("../../../common/errors"));
const replayConfigurationParser = new validate_value_1.Parser({
    type: 'object',
    properties: {
        flows: {
            type: 'array',
            items: { type: 'string', minLength: 1 }
        },
        contexts: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    contextName: { type: 'string' },
                    aggregates: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                aggregateName: { type: 'string' },
                                instances: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            aggregateId: { type: 'string', format: 'uuid' },
                                            from: { type: 'number', minimum: 1 },
                                            to: { type: 'number', minimum: 1 }
                                        },
                                        required: ['aggregateId'],
                                        additionalProperties: false
                                    }
                                }
                            },
                            required: ['aggregateName'],
                            additionalProperties: false
                        }
                    }
                },
                required: ['contextName'],
                additionalProperties: false
            }
        }
    },
    required: [],
    additionalProperties: false
});
const parseReplayConfiguration = function ({ application, replayConfiguration }) {
    replayConfigurationParser.parse(replayConfiguration, { valueName: 'replayConfiguration' }).unwrapOrThrow((err) => new errors.ReplayConfigurationInvalid({ cause: err }));
    const typeSafeReplayConfiguration = replayConfiguration;
    if (typeSafeReplayConfiguration.flows) {
        for (const flowName of typeSafeReplayConfiguration.flows) {
            if (!(flowName in application.flows)) {
                return defekt_1.error(new errors.ReplayConfigurationInvalid(`Flow '${flowName}' not found.`));
            }
        }
    }
    if (typeSafeReplayConfiguration.contexts) {
        const seenContextNames = new Set();
        for (const context of typeSafeReplayConfiguration.contexts) {
            if (!(context.contextName in application.domain)) {
                return defekt_1.error(new errors.ReplayConfigurationInvalid(`Context '${context.contextName}' not found.`));
            }
            if (seenContextNames.has(context.contextName)) {
                return defekt_1.error(new errors.ReplayConfigurationInvalid(`Context '${context.contextName}' is duplicated.`));
            }
            seenContextNames.add(context.contextName);
            if (context.aggregates) {
                const seenAggregateNames = new Set();
                for (const aggregate of context.aggregates) {
                    if (!(aggregate.aggregateName in application.domain[context.contextName])) {
                        return defekt_1.error(new errors.ReplayConfigurationInvalid(`Aggregate '${context.contextName}.${aggregate.aggregateName}' not found.`));
                    }
                    if (seenAggregateNames.has(aggregate.aggregateName)) {
                        return defekt_1.error(new errors.ReplayConfigurationInvalid(`Aggregate '${context.contextName}.${aggregate.aggregateName}' is duplicated.`));
                    }
                    seenAggregateNames.add(aggregate.aggregateName);
                    if (aggregate.instances) {
                        const seenInstanceIds = new Set();
                        for (const instance of aggregate.instances) {
                            if (seenInstanceIds.has(instance.aggregateId)) {
                                return defekt_1.error(new errors.ReplayConfigurationInvalid(`Aggregate instance '${context.contextName}.${aggregate.aggregateName}.${instance.aggregateId}' is duplicated.`));
                            }
                            seenInstanceIds.add(instance.aggregateId);
                            if (instance.from && instance.to && instance.from > instance.to) {
                                return defekt_1.error(new errors.ReplayConfigurationInvalid(`Can not replay from ${instance.from} to ${instance.to} for aggregate '${context.contextName}.${aggregate.aggregateName}'.`));
                            }
                        }
                    }
                }
            }
        }
    }
    return defekt_1.value(replayConfiguration);
};
exports.parseReplayConfiguration = parseReplayConfiguration;
//# sourceMappingURL=parseReplayConfiguration.js.map