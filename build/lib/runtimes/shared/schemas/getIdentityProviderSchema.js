"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIdentityProviderSchema = void 0;
const getIdentityProviderSchema = function () {
    return {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                issuer: { type: 'string' },
                certificate: { type: 'string' }
            },
            required: ['issuer', 'certificate'],
            additionalProperties: false
        }
    };
};
exports.getIdentityProviderSchema = getIdentityProviderSchema;
//# sourceMappingURL=getIdentityProviderSchema.js.map