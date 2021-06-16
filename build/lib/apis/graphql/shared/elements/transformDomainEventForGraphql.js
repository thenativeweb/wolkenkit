"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformDomainEventForGraphql = void 0;
const transformDomainEventForGraphql = function ({ domainEvent }) {
    return {
        ...domainEvent,
        data: JSON.stringify(domainEvent.data),
        metadata: {
            ...domainEvent.metadata,
            initiator: {
                user: {
                    id: domainEvent.metadata.initiator.user.id
                }
            }
        }
    };
};
exports.transformDomainEventForGraphql = transformDomainEventForGraphql;
//# sourceMappingURL=transformDomainEventForGraphql.js.map