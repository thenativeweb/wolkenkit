import { Subscriber } from './Subscriber';
import { SubscriberOptions } from './SubscriberOptions';
declare const createSubscriber: <T extends object>(options: SubscriberOptions) => Promise<Subscriber<T>>;
export { createSubscriber };
