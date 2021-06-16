"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDomainEvent = void 0;
const DomainEvent_1 = require("../../elements/DomainEvent");
const uuid_1 = require("uuid");
const buildDomainEvent = function ({ aggregateIdentifier, name, data, id, metadata }) {
    var _a, _b, _c, _d, _e;
    return new DomainEvent_1.DomainEvent({
        aggregateIdentifier,
        name,
        data,
        id: id !== null && id !== void 0 ? id : uuid_1.v4(),
        metadata: {
            causationId: (_a = metadata.causationId) !== null && _a !== void 0 ? _a : uuid_1.v4(),
            correlationId: (_b = metadata.correlationId) !== null && _b !== void 0 ? _b : uuid_1.v4(),
            timestamp: (_c = metadata.timestamp) !== null && _c !== void 0 ? _c : Date.now(),
            revision: metadata.revision,
            initiator: (_d = metadata.initiator) !== null && _d !== void 0 ? _d : {
                user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
            },
            tags: (_e = metadata.tags) !== null && _e !== void 0 ? _e : []
        }
    });
};
exports.buildDomainEvent = buildDomainEvent;
//# sourceMappingURL=buildDomainEvent.js.map