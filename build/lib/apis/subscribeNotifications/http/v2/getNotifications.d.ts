import { Application } from '../../../../common/application/Application';
import { Notification } from '../../../../common/elements/Notification';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getNotifications: {
    description: string;
    path: string;
    request: {};
    response: {
        statusCodes: number[];
        stream: boolean;
        body: {};
    };
    getHandler({ application, subscriber, channelForNotifications, heartbeatInterval }: {
        application: Application;
        subscriber: Subscriber<Notification>;
        channelForNotifications: string;
        heartbeatInterval: number;
    }): WolkenkitRequestHandler;
};
export { getNotifications };
