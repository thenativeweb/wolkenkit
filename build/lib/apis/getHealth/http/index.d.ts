import { CorsOrigin } from 'get-cors-origin';
import { Application } from 'express';
declare const getApi: ({ corsOrigin }: {
    corsOrigin: CorsOrigin;
}) => Promise<{
    api: Application;
}>;
export { getApi };
