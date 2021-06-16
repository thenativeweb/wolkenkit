"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoggerService = void 0;
const flaschenpost_1 = require("flaschenpost");
const getLoggerService = function ({ fileName, packageManifest }) {
    const logger = flaschenpost_1.flaschenpost.getLogger(fileName, packageManifest);
    return logger;
};
exports.getLoggerService = getLoggerService;
//# sourceMappingURL=getLoggerService.js.map