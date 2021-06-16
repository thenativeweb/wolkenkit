"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandsDescriptionSchema = void 0;
const getCommandsDescriptionSchema = function () {
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
exports.getCommandsDescriptionSchema = getCommandsDescriptionSchema;
//# sourceMappingURL=getCommandsDescriptionSchema.js.map