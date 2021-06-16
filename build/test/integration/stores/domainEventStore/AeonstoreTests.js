"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Aeonstore_1 = require("../../../../lib/stores/domainEventStore/Aeonstore");
const getSocketPaths_1 = require("../../../shared/getSocketPaths");
const getTestsFor_1 = require("./getTestsFor");
const startProcess_1 = require("../../../../lib/runtimes/shared/startProcess");
const processMap = new Map();
suite('Aeonstore', () => {
    getTestsFor_1.getTestsFor({
        async createDomainEventStore({ suffix }) {
            const [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
            const stopProcess = await startProcess_1.startProcess({
                runtime: 'microservice',
                name: 'domainEventStore',
                enableDebugMode: false,
                portOrSocket: healthSocket,
                env: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    PORT_OR_SOCKET: socket,
                    HEALTH_PORT_OR_SOCKET: healthSocket
                    /* eslint-enable @typescript-eslint/naming-convention */
                }
            });
            processMap.set(suffix, stopProcess);
            const aeonstoreDomainEventStore = await Aeonstore_1.AeonstoreDomainEventStore.create({
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: socket,
                path: '/'
            });
            return aeonstoreDomainEventStore;
        },
        async teardownDomainEventStore({ suffix }) {
            const stopProcess = processMap.get(suffix);
            if (stopProcess === undefined) {
                return;
            }
            await stopProcess();
            processMap.delete(suffix);
        }
    });
});
//# sourceMappingURL=AeonstoreTests.js.map