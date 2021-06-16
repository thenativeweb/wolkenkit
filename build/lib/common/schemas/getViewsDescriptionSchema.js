"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewsDescriptionSchema = void 0;
const getViewsDescriptionSchema = function () {
    return {
        type: 'object',
        patternProperties: {
            '.*': {
                type: 'object',
                patternProperties: {
                    '.*': {
                        type: 'object',
                        properties: {
                            documentation: { type: 'string' },
                            optionsSchema: { type: 'object' },
                            itemSchema: { type: 'object' }
                        },
                        additionalProperties: false
                    }
                }
            }
        }
    };
};
exports.getViewsDescriptionSchema = getViewsDescriptionSchema;
//# sourceMappingURL=getViewsDescriptionSchema.js.map