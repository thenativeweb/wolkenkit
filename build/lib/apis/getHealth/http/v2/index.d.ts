import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
declare const getV2: ({ corsOrigin }: {
    corsOrigin: CorsOrigin;
}) => Promise<{
    api: Application;
}>;
export { getV2 };
