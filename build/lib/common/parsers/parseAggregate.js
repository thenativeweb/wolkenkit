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
exports.parseAggregate = void 0;
const parseCommandHandler_1 = require("./parseCommandHandler");
const parseDomainEventHandler_1 = require("./parseDomainEventHandler");
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseAggregate = function ({ aggregate }) {
    if (lodash_1.isUndefined(aggregate.getInitialState)) {
        return defekt_1.error(new errors.AggregateDefinitionMalformed(`Function 'getInitialState' is missing.`));
    }
    if (!lodash_1.isFunction(aggregate.getInitialState)) {
        return defekt_1.error(new errors.AggregateDefinitionMalformed(`Property 'getInitialState' is not a function.`));
    }
    if (lodash_1.isUndefined(aggregate.commandHandlers)) {
        return defekt_1.error(new errors.AggregateDefinitionMalformed(`Object 'commandHandlers' is missing.`));
    }
    if (!lodash_1.isObject(aggregate.commandHandlers)) {
        return defekt_1.error(new errors.AggregateDefinitionMalformed(`Property 'commandHandlers' is not an object.`));
    }
    for (const [commandHandlerName, commandHandler] of Object.entries(aggregate.commandHandlers)) {
        const parseResult = parseCommandHandler_1.parseCommandHandler({ commandHandler });
        if (parseResult.hasError()) {
            return defekt_1.error(new errors.AggregateDefinitionMalformed(`Command handler '${commandHandlerName}' is malformed: ${parseResult.error.message}`));
        }
    }
    if (lodash_1.isUndefined(aggregate.domainEventHandlers)) {
        return defekt_1.error(new errors.AggregateDefinitionMalformed(`Object 'domainEventHandlers' is missing.`));
    }
    if (!lodash_1.isObject(aggregate.domainEventHandlers)) {
        return defekt_1.error(new errors.AggregateDefinitionMalformed(`Property 'domainEventHandlers' is not an object.`));
    }
    for (const [domainEventHandlerName, domainEventHandler] of Object.entries(aggregate.domainEventHandlers)) {
        const parseResult = parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler });
        if (parseResult.hasError()) {
            return defekt_1.error(new errors.AggregateDefinitionMalformed(`Domain event handler '${domainEventHandlerName}' is malformed: ${parseResult.error.message}`));
        }
    }
    if (!lodash_1.isUndefined(aggregate.enhancers)) {
        if (!lodash_1.isArray(aggregate.enhancers)) {
            return defekt_1.error(new errors.AggregateDefinitionMalformed(`Property 'enhancers' is not an array.`));
        }
        for (const [index, enhancer] of aggregate.enhancers.entries()) {
            if (!lodash_1.isFunction(enhancer)) {
                return defekt_1.error(new errors.AggregateDefinitionMalformed(`Aggregate enhancer at index ${index} is not a function.`));
            }
        }
    }
    return defekt_1.value(aggregate);
};
exports.parseAggregate = parseAggregate;
//# sourceMappingURL=parseAggregate.js.map