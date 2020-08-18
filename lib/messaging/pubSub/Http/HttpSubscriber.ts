import { Client } from '../../../apis/subscribeMessages/http/v2/Client';
import { HttpSubscriberOptions } from './HttpSubscriberOptions';
import { Subscriber } from '../Subscriber';

class HttpSubscriber<T extends object> implements Subscriber<T> {
  protected unsubscribeFunctions: Map<Function, Map<string, Function>>;

  protected subscriberClient: Client;

  protected constructor ({ subscriberClient }: {
    subscriberClient: Client;
  }) {
    this.unsubscribeFunctions = new Map();
    this.subscriberClient = subscriberClient;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async create<T extends object> (options: HttpSubscriberOptions): Promise<HttpSubscriber<T>> {
    const subscriberClient = new Client({
      protocol: options.protocol,
      hostName: options.hostName,
      port: options.port,
      path: options.path
    });

    return new HttpSubscriber({
      subscriberClient
    });
  }

  public async subscribe ({ channel, callback }: {
    channel: string;
    callback: (message: T) => void | Promise<void>;
  }): Promise<void> {
    const messageStream = await this.subscriberClient.getMessages({ channel });

    let unsubscribeFromStream: () => void;

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
    callback: (message: T) => void | Promise<void>;
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
