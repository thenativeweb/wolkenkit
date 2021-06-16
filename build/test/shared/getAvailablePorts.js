"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailablePorts = void 0;
const net_1 = require("net");
const servers = {};
const lockPort = async function () {
    return new Promise((resolve, reject) => {
        const server = net_1.createServer();
        let port;
        server.once('listening', () => {
            ({ port } = server.address());
            servers[port] = server;
            resolve(port);
        });
        server.once('error', (err) => {
            reject(err);
        });
        server.listen(0);
    });
};
const releasePort = async function ({ port }) {
    const server = servers[port];
    if (!server) {
        throw new Error(`Port ${port} is not locked.`);
    }
    await new Promise((resolve, reject) => {
        server.close(async (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};
const getAvailablePorts = async function ({ count }) {
    const availablePorts = [];
    do {
        const availablePort = await lockPort();
        if (availablePorts.includes(availablePort)) {
            continue;
        }
        availablePorts.push(availablePort);
    } while (availablePorts.length < count);
    for (const availablePort of availablePorts) {
        await releasePort({ port: availablePort });
    }
    return availablePorts;
};
exports.getAvailablePorts = getAvailablePorts;
//# sourceMappingURL=getAvailablePorts.js.map