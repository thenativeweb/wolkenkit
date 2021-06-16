"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpSubscriber = void 0;
const Client_1 = require("../../../apis/subscribeMessages/http/v2/Client");
class HttpSubscriber {
    constructor({ subscriberClient }) {
        this.unsubscribeFunctions = new Map();
        this.subscriberClient = subscriberClient;
    }
    static async create(options) {
        const subscriberClient = new Client_1.Client({
            protocol: options.protocol,
            hostName: options.hostName,
            portOrSocket: options.portOrSocket,
            path: options.path
        });
        return new HttpSubscriber({
            subscriberClient
        });
    }
    async subscribe({ channel, callback }) {
        const messageStream = await this.subscriberClient.getMessages({ channel });
        let unsubscribeFromStream;
        const onData = async (message) => {
            messageStream.pause();
            // eslint-disable-next-line callback-return
            await callback(message);
            messageStream.resume();
        };
        const onError = () => {
            unsubscribeFromStream();
        };
        unsubscribeFromStream = () => {
            messageStream.off('data', onData);
            messageStream.off('error', onError);
            messageStream.destroy();
        };
        messageStream.on('data', onData);
        messageStream.on('error', onError);
        if (!this.unsubscribeFunctions.get(callback)) {
            this.unsubscribeFunctions.set(callback, new Map());
        }
        this.unsubscribeFunctions.get(callback).set(channel, unsubscribeFromStream);
    }
    async unsubscribe({ channel, callback }) {
        const callbackMap = this.unsubscribeFunctions.get(callback);
        if (!callbackMap) {
            return;
        }
        const unsubscribeFunction = callbackMap.get(channel);
        if (!unsubscribeFunction) {
            return;
        }
        unsubscribeFunction();
        callbackMap.delete(channel);
        if (callbackMap.size === 0) {
            this.unsubscribeFunctions.delete(callback);
        }
    }
}
exports.HttpSubscriber = HttpSubscriber;
//# sourceMappingURL=HttpSubscriber.js.map