"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortOrSocketSchema = void 0;
const getPortOrSocketSchema = function () {
    return {
        oneOf: [
            {
                type: 'integer',
                minimum: 1,
                maximum: 65535
            },
            {
                type: 'string',
                minLength: 1
            }
        ]
    };
};
exports.getPortOrSocketSchema = getPortOrSocketSchema;
//# sourceMappingURL=getPortOrSocketSchema.js.map