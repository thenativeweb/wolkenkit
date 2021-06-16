import { PoolConnection } from 'mysql';
declare const runQuery: ({ connection, query, parameters }: {
    connection: PoolConnection;
    query: string;
    parameters?: any[] | undefined;
}) => Promise<any>;
export { runQuery };
