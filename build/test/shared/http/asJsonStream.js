"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asJsonStream = void 0;
const stream_1 = require("stream");
const asJsonStream = function (handleJson, objectMode = false) {
    let counter = 0;
    return new stream_1.Writable({
        objectMode,
        write(chunk, encoding, callback) {
            const data = objectMode ? chunk : JSON.parse(chunk.toString());
            // Ignore any messages after all handlers have been applied.
            if (counter >= handleJson.length) {
                return;
            }
            handleJson[counter](data);
            counter += 1;
            callback();
        }
    });
};
exports.asJsonStream = asJsonStream;
//# sourceMappingURL=asJsonStream.js.map