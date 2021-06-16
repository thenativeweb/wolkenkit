import { Application } from 'express';
import { AxiosInstance } from 'axios';
declare const runAsServer: ({ app }: {
    app: Application;
}) => Promise<{
    client: AxiosInstance;
    socket: string;
}>;
export { runAsServer };
