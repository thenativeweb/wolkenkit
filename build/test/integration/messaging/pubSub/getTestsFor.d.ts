import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
declare const getTestsFor: ({ createPublisher, createSubscriber }: {
    createPublisher: <T extends object>() => Promise<Publisher<T>>;
    createSubscriber: <T_1 extends object>() => Promise<Subscriber<T_1>>;
}) => void;
export { getTestsFor };
