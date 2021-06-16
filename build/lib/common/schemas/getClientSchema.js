"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientSchema = void 0;
const getClientSchema = function () {
    return {
        type: 'object',
        properties: {
            token: { type: 'string', minLength: 1 },
            user: {
                type: 'object',
                properties: {
                    id: { type: 'string', minLength: 1 },
                    claims: {
                        type: 'object',
                        properties: {
                            sub: { type: 'string', minLength: 1 }
                        },
                        required: ['sub'],
                        additionalProperties: true
                    }
                },
                required: ['id', 'claims'],
                additionalProperties: false
            },
            ip: { type: 'string', minLength: 1 }
        },
        required: ['token', 'user', 'ip'],
        additionalProperties: false
    };
};
exports.getClientSchema = getClientSchema;
//# sourceMappingURL=getClientSchema.js.map