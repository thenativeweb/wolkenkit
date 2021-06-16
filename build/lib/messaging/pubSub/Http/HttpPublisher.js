"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpPublisher = void 0;
const Client_1 = require("../../../apis/publishMessage/http/v2/Client");
class HttpPublisher {
    constructor({ publisherClient }) {
        this.publisherClient = publisherClient;
    }
    static async create(options) {
        const publisherClient = new Client_1.Client({
            protocol: options.protocol,
            hostName: options.hostName,
            portOrSocket: options.portOrSocket,
            path: options.path
        });
        return new HttpPublisher({ publisherClient });
    }
    async publish({ channel, message }) {
        await this.publisherClient.postMessage({
            channel,
            message
        });
    }
}
exports.HttpPublisher = HttpPublisher;
//# sourceMappingURL=HttpPublisher.js.map