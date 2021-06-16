"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseJsonTransform = void 0;
const stream_1 = require("stream");
class ParseJsonTransform extends stream_1.Transform {
    constructor() {
        super({
            readableObjectMode: true,
            writableObjectMode: false
        });
    }
    /* eslint-disable @typescript-eslint/naming-convention, no-underscore-dangle, class-methods-use-this */
    _transform(chunk, encoding, next) {
        const text = chunk.toString();
        const parts = text.split('\n');
        for (const part of parts) {
            if (part !== '') {
                const data = JSON.parse(part);
                this.push(data);
            }
        }
        next(null);
    }
}
exports.ParseJsonTransform = ParseJsonTransform;
//# sourceMappingURL=ParseJsonTransform.js.map