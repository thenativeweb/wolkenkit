"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorsSchema = void 0;
const getCorsSchema = function () {
    return {
        anyOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
        ]
    };
};
exports.getCorsSchema = getCorsSchema;
//# sourceMappingURL=getCorsSchema.js.map