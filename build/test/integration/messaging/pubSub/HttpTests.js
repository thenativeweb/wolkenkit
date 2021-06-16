"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getSocketPaths_1 = require("../../../shared/getSocketPaths");
const getTestsFor_1 = require("./getTestsFor");
const HttpPublisher_1 = require("../../../../lib/messaging/pubSub/Http/HttpPublisher");
const HttpSubscriber_1 = require("../../../../lib/messaging/pubSub/Http/HttpSubscriber");
const startProcess_1 = require("../../../../lib/runtimes/shared/startProcess");
suite('Http', () => {
    let healthSocket, socket, stopProcess;
    suiteSetup(async () => {
        [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
        stopProcess = await startProcess_1.startProcess({
            runtime: 'microservice',
            name: 'publisher',
            enableDebugMode: false,
            portOrSocket: healthSocket,
            env: {
                /* eslint-disable @typescript-eslint/naming-convention */
                PORT_OR_SOCKET: socket,
                HEALTH_PORT_OR_SOCKET: healthSocket
                /* eslint-enable @typescript-eslint/naming-convention */
            }
        });
    });
    suiteTeardown(async () => {
        await stopProcess();
    });
    getTestsFor_1.getTestsFor({
        async createPublisher() {
            return await HttpPublisher_1.HttpPublisher.create({
                type: 'Http',
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: socket,
                path: '/publish/v2'
            });
        },
        async createSubscriber() {
            return await HttpSubscriber_1.HttpSubscriber.create({
                type: 'Http',
                protocol: 'http',
                hostName: 'localhost',
                portOrSocket: socket,
                path: '/subscribe/v2'
            });
        }
    });
});
//# sourceMappingURL=HttpTests.js.map