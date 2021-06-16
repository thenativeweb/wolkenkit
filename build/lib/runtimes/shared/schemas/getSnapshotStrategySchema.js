"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnapshotStrategySchema = void 0;
const getSnapshotStrategySchema = function () {
    return {
        anyOf: [
            {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        enum: ['lowest']
                    },
                    configuration: {
                        type: 'object',
                        properties: {
                            revisionLimit: {
                                type: 'number',
                                minimum: 1
                            },
                            durationLimit: {
                                type: 'number',
                                minimum: 1
                            }
                        },
                        required: ['revisionLimit', 'durationLimit'],
                        additionalProperties: false
                    }
                },
                required: ['name', 'configuration'],
                additionalProperties: false
            },
            {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        enum: ['revision']
                    },
                    configuration: {
                        type: 'object',
                        properties: {
                            revisionLimit: {
                                type: 'number',
                                minimum: 1
                            }
                        },
                        required: ['revisionLimit'],
                        additionalProperties: false
                    }
                },
                required: ['name', 'configuration'],
                additionalProperties: false
            },
            {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        enum: ['duration']
                    },
                    configuration: {
                        type: 'object',
                        properties: {
                            durationLimit: {
                                type: 'number',
                                minimum: 1
                            }
                        },
                        required: ['durationLimit'],
                        additionalProperties: false
                    }
                },
                required: ['name', 'configuration'],
                additionalProperties: false
            },
            {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        enum: ['always']
                    }
                },
                required: ['name'],
                additionalProperties: false
            },
            {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        enum: ['never']
                    }
                },
                required: ['name'],
                additionalProperties: false
            }
        ]
    };
};
exports.getSnapshotStrategySchema = getSnapshotStrategySchema;
//# sourceMappingURL=getSnapshotStrategySchema.js.map