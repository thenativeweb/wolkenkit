import { Pool } from 'mysql';
declare const createPoolWithDefaults: ({ hostName, port, userName, password, database }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
}) => Pool;
export { createPoolWithDefaults };
