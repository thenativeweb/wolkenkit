"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainEventsDescriptionSchema = void 0;
const getDomainEventsDescriptionSchema = function () {
    return {
        type: 'object',
        patternProperties: {
            '.*': {
                type: 'object',
                patternProperties: {
                    '.*': {
                        type: 'object',
                        patternProperties: {
                            '.*': {
                                type: 'object',
                                properties: {
                                    documentation: { type: 'string' },
                                    schema: { type: 'object' }
                                },
                                additionalProperties: false
                            }
                        }
                    }
                }
            }
        }
    };
};
exports.getDomainEventsDescriptionSchema = getDomainEventsDescriptionSchema;
//# sourceMappingURL=getDomainEventsDescriptionSchema.js.map