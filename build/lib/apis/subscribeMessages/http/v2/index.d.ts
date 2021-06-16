import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { PublishMessage } from '../../PublishMessage';
declare const getV2: ({ corsOrigin, heartbeatInterval }: {
    corsOrigin: CorsOrigin;
    heartbeatInterval?: number | undefined;
}) => Promise<{
    api: Application;
    publishMessage: PublishMessage;
}>;
export { getV2 };
