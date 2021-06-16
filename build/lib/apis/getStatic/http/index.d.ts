import { CorsOrigin } from 'get-cors-origin';
import { Application } from 'express';
declare const getApi: ({ corsOrigin, directory }: {
    corsOrigin: CorsOrigin;
    directory: string;
}) => Promise<{
    api: Application;
}>;
export { getApi };
