import { PoolClient } from 'pg';
declare const withTransaction: <TResult = void>({ getConnection, releaseConnection, fn }: {
    getConnection: () => Promise<PoolClient>;
    releaseConnection?: (({ connection }: {
        connection: PoolClient;
    }) => Promise<void>) | undefined;
    fn: ({ connection }: {
        connection: PoolClient;
    }) => Promise<TResult>;
}) => Promise<TResult>;
export { withTransaction };
