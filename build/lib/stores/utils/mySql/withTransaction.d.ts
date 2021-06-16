import { PoolConnection } from 'mysql';
declare const withTransaction: <TResult = void>({ getConnection, releaseConnection, fn }: {
    getConnection: () => Promise<PoolConnection>;
    releaseConnection?: (({ connection }: {
        connection: PoolConnection;
    }) => Promise<void>) | undefined;
    fn: ({ connection }: {
        connection: PoolConnection;
    }) => Promise<TResult>;
}) => Promise<TResult>;
export { withTransaction };
