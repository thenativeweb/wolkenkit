"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeLine = void 0;
const defekt_1 = require("defekt");
const writeLine = function ({ res, data }) {
    try {
        res.write(`${JSON.stringify(data)}\n`);
    }
    catch (ex) {
        if (defekt_1.isCustomError(ex) && ex.code === 'ERR_STREAM_WRITE_AFTER_END') {
            // Ignore write after end errors. This simply means that the connection
            // was closed concurrently, and we can't do anything about it anyway.
            return;
        }
        throw ex;
    }
};
exports.writeLine = writeLine;
//# sourceMappingURL=writeLine.js.map