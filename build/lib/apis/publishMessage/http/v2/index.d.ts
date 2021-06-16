import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { OnReceiveMessage } from '../../OnReceiveMessage';
declare const getV2: ({ corsOrigin, onReceiveMessage }: {
    corsOrigin: CorsOrigin;
    onReceiveMessage: OnReceiveMessage;
}) => Promise<{
    api: Application;
}>;
export { getV2 };
