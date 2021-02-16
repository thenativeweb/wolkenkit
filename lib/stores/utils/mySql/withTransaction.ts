import { PoolConnection } from 'mysql';
import { runQuery } from './runQuery';

const withTransaction = async function<TResult = void> ({
  getConnection,
  releaseConnection,
  fn
}:
{
  getConnection: () => Promise<PoolConnection>;
  releaseConnection?: ({ connection }: { connection: PoolConnection }) => Promise<void>;
  fn: ({ connection }: { connection: PoolConnection }) => Promise<TResult>;
}): Promise<TResult> {
  const connection = await getConnection();

  let result: TResult;

  try {
    await runQuery({ connection, query: 'START TRANSACTION' });

    result = await fn({ connection });

    await runQuery({ connection, query: 'COMMIT' });
  } catch (ex: unknown) {
    await runQuery({ connection, query: 'ROLLBACK' });
    throw ex;
  } finally {
    if (releaseConnection) {
      await releaseConnection({ connection });
    }
  }

  return result;
};

export { withTransaction };
