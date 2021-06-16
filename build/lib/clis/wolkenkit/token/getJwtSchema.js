"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSchema = void 0;
const getJwtSchema = function () {
    return {
        type: 'object',
        properties: {
            sub: { type: 'string', minLength: 1 }
        },
        required: ['sub'],
        additionalProperties: true
    };
};
exports.getJwtSchema = getJwtSchema;
//# sourceMappingURL=getJwtSchema.js.map