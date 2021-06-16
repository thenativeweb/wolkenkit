import { Client } from '../../../apis/subscribeMessages/http/v2/Client';
import { HttpSubscriberOptions } from './HttpSubscriberOptions';
import { Subscriber } from '../Subscriber';
declare type CallbackFunction<T> = (message: T) => void | Promise<void>;
declare type UnsubscribeFunction = () => void;
declare class HttpSubscriber<T extends object> implements Subscriber<T> {
    protected unsubscribeFunctions: Map<CallbackFunction<T>, Map<string, UnsubscribeFunction>>;
    protected subscriberClient: Client;
    protected constructor({ subscriberClient }: {
        subscriberClient: Client;
    });
    static create<TCreate extends object>(options: HttpSubscriberOptions): Promise<HttpSubscriber<TCreate>>;
    subscribe({ channel, callback }: {
        channel: string;
        callback: CallbackFunction<T>;
    }): Promise<void>;
    unsubscribe({ channel, callback }: {
        channel: string;
        callback: CallbackFunction<T>;
    }): Promise<void>;
}
export { HttpSubscriber };
