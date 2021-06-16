"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailablePort = void 0;
const getAvailablePorts_1 = require("./getAvailablePorts");
const getAvailablePort = async function () {
    const [availablePort] = await getAvailablePorts_1.getAvailablePorts({ count: 1 });
    return availablePort;
};
exports.getAvailablePort = getAvailablePort;
//# sourceMappingURL=getAvailablePort.js.map