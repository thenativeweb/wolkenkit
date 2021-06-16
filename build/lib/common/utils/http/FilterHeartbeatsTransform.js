"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterHeartbeatsTransform = void 0;
const lodash_1 = require("lodash");
const stream_1 = require("stream");
class FilterHeartbeatsTransform extends stream_1.Transform {
    constructor() {
        super({
            objectMode: true
        });
    }
    /* eslint-disable @typescript-eslint/naming-convention, no-underscore-dangle, class-methods-use-this */
    _transform(streamItem, encoding, next) {
        if (lodash_1.isEqual(streamItem, { name: 'heartbeat' })) {
            return next();
        }
        next(null, streamItem);
    }
}
exports.FilterHeartbeatsTransform = FilterHeartbeatsTransform;
//# sourceMappingURL=FilterHeartbeatsTransform.js.map