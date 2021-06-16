"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsDescriptionSchema = void 0;
const getNotificationsDescriptionSchema = function () {
    return {
        type: 'object',
        patternProperties: {
            '.*': {
                type: 'object',
                properties: {
                    documentation: { type: 'string' },
                    dataSchema: { type: 'object' },
                    metadataSchema: { type: 'object' }
                },
                additionalProperties: false
            }
        }
    };
};
exports.getNotificationsDescriptionSchema = getNotificationsDescriptionSchema;
//# sourceMappingURL=getNotificationsDescriptionSchema.js.map