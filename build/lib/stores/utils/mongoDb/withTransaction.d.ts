import { ClientSession, MongoClient } from 'mongodb';
declare const withTransaction: <TResult = void>({ client, fn }: {
    client: MongoClient;
    fn: ({ session }: {
        session: ClientSession;
    }) => Promise<TResult>;
}) => Promise<TResult>;
export { withTransaction };
