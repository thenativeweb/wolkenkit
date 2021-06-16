import { CorsOrigin } from 'get-cors-origin';
import { OnReceiveMessage } from '../OnReceiveMessage';
import { Application } from 'express';
declare const getApi: ({ corsOrigin, onReceiveMessage }: {
    corsOrigin: CorsOrigin;
    onReceiveMessage: OnReceiveMessage;
}) => Promise<{
    api: Application;
}>;
export { getApi };
