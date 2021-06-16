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
exports.withSystemDomainEvents = void 0;
const lodash_1 = require("lodash");
const errors = __importStar(require("../common/errors"));
const withSystemDomainEvents = (application) => {
    const clonedApplication = lodash_1.cloneDeep(application);
    // Cloning the infrastructure can have unforseen consequences, since it might
    // mess with the prototype chain of e.g. a database client and stop it from
    // working. These bugs would be very hard to catch (believe me, like one and
    // a half days of debugging).
    clonedApplication.infrastructure = application.infrastructure;
    for (const [contextName, contextDefinition] of Object.entries(clonedApplication.domain)) {
        for (const [aggregateName, aggregateDefinition] of Object.entries(contextDefinition)) {
            for (const commandName of Object.keys(aggregateDefinition.commandHandlers)) {
                const domainEventNameFailed = `${commandName}Failed`;
                const domainEventNameRejected = `${commandName}Rejected`;
                if (domainEventNameFailed in clonedApplication.domain[contextName][aggregateName].domainEventHandlers) {
                    throw new errors.DomainEventAlreadyExists(`Reserved domain event name '${domainEventNameFailed}' used in '<app>/server/domain/${contextName}/${aggregateName}/'.`);
                }
                if (domainEventNameRejected in clonedApplication.domain[contextName][aggregateName].domainEventHandlers) {
                    throw new errors.DomainEventAlreadyExists(`Reserved domain event name '${domainEventNameRejected}' used in '<app>/server/domain/${contextName}/${aggregateName}/'.`);
                }
                const domainEventHandler = {
                    getSchema() {
                        return {
                            type: 'object',
                            properties: {
                                reason: { type: 'string' }
                            },
                            required: ['reason'],
                            additionalProperties: false
                        };
                    },
                    handle(state) {
                        return state;
                    },
                    isAuthorized(state, domainEvent, { client }) {
                        return domainEvent.metadata.initiator.user.id === client.user.id;
                    }
                };
                clonedApplication.domain[contextName][aggregateName].domainEventHandlers[domainEventNameFailed] = domainEventHandler;
                clonedApplication.domain[contextName][aggregateName].domainEventHandlers[domainEventNameRejected] = domainEventHandler;
            }
        }
    }
    return clonedApplication;
};
exports.withSystemDomainEvents = withSystemDomainEvents;
//# sourceMappingURL=withSystemDomainEvents.js.map