"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProtocolSchema = void 0;
const getProtocolSchema = function () {
    return {
        type: 'string',
        enum: ['http', 'https']
    };
};
exports.getProtocolSchema = getProtocolSchema;
//# sourceMappingURL=getProtocolSchema.js.map