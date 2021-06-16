import { CorsOrigin } from 'get-cors-origin';
import { PublishMessage } from '../PublishMessage';
import { Application } from 'express';
declare const getApi: ({ corsOrigin, heartbeatInterval }: {
    corsOrigin: CorsOrigin;
    heartbeatInterval?: number | undefined;
}) => Promise<{
    api: Application;
    publishMessage: PublishMessage;
}>;
export { getApi };
