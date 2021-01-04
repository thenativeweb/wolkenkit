import { Client } from '../../../apis/subscribeMessages/http/v2/Client';
import { HttpSubscriberOptions } from './HttpSubscriberOptions';
import { Subscriber } from '../Subscriber';

type CallbackFunction<T> = (message: T) => void | Promise<void>;
type UnsubscribeFunction = () => void;

class HttpSubscriber<T extends object> implements Subscriber<T> {
  protected unsubscribeFunctions: Map<CallbackFunction<T>, Map<string, UnsubscribeFunction>>;

  protected subscriberClient: Client;

  protected constructor ({ subscriberClient }: {
    subscriberClient: Client;
  }) {
    this.unsubscribeFunctions = new Map();
    this.subscriberClient = subscriberClient;
  }

  public static async create<TCreate extends object> (options: HttpSubscriberOptions): Promise<HttpSubscriber<TCreate>> {
    const subscriberClient = new Client({
      protocol: options.protocol,
      hostName: options.hostName,
      portOrSocket: options.portOrSocket,
      path: options.path
    });

    return new HttpSubscriber({
      subscriberClient
    });
  }

  public async subscribe ({ channel, callback }: {
    channel: string;
    callback: CallbackFunction<T>;
  }): Promise<void> {
    const messageStream = await this.subscriberClient.getMessages({ channel });

    let unsubscribeFromStream: UnsubscribeFunction;

    const onData = async (message: T): Promise<void> => {
      messageStream.pause();
      // eslint-disable-next-line callback-return
      await callback(message);
      messageStream.resume();
    };
    const onError = (): void => {
      unsubscribeFromStream();
    };

    unsubscribeFromStream = (): void => {
      messageStream.off('data', onData);
      messageStream.off('error', onError);
      messageStream.destroy();
    };

    messageStream.on('data', onData);
    messageStream.on('error', onError);

    if (!this.unsubscribeFunctions.get(callback)) {
      this.unsubscribeFunctions.set(callback, new Map());
    }
    this.unsubscribeFunctions.get(callback)!.set(channel, unsubscribeFromStream);
  }

  public async unsubscribe ({ channel, callback }: {
    channel: string;
    callback: CallbackFunction<T>;
  }): Promise<void> {
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

export { HttpSubscriber };
