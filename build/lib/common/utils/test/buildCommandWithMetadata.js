"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommandWithMetadata = void 0;
const CommandWithMetadata_1 = require("../../elements/CommandWithMetadata");
const uuid_1 = require("uuid");
const buildCommandWithMetadata = function ({ aggregateIdentifier, name, data, id, metadata }) {
    var _a, _b, _c, _d, _e;
    return new CommandWithMetadata_1.CommandWithMetadata({
        aggregateIdentifier,
        name,
        data,
        id: id !== null && id !== void 0 ? id : uuid_1.v4(),
        metadata: {
            causationId: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.causationId) !== null && _a !== void 0 ? _a : uuid_1.v4(),
            correlationId: (_b = metadata === null || metadata === void 0 ? void 0 : metadata.correlationId) !== null && _b !== void 0 ? _b : uuid_1.v4(),
            timestamp: (_c = metadata === null || metadata === void 0 ? void 0 : metadata.timestamp) !== null && _c !== void 0 ? _c : Date.now(),
            client: (_d = metadata === null || metadata === void 0 ? void 0 : metadata.client) !== null && _d !== void 0 ? _d : {
                ip: '127.0.0.1',
                user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                token: '...'
            },
            initiator: (_e = metadata === null || metadata === void 0 ? void 0 : metadata.initiator) !== null && _e !== void 0 ? _e : {
                user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
            }
        }
    });
};
exports.buildCommandWithMetadata = buildCommandWithMetadata;
//# sourceMappingURL=buildCommandWithMetadata.js.map