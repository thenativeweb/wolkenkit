"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToDomainEventStream = void 0;
const DomainEvent_1 = require("../../../common/elements/DomainEvent");
const stream_1 = require("stream");
class ToDomainEventStream extends stream_1.Transform {
    constructor({ column = 'domainEvent' } = {}) {
        super({ objectMode: true });
        this.column = column;
    }
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
    _transform(row, _encoding, callback) {
        try {
            const domainEvent = new DomainEvent_1.DomainEvent(JSON.parse(row[this.column]));
            this.push(domainEvent);
            return callback(null);
        }
        catch (ex) {
            return callback(ex);
        }
    }
}
exports.ToDomainEventStream = ToDomainEventStream;
//# sourceMappingURL=ToDomainEventStream.js.map