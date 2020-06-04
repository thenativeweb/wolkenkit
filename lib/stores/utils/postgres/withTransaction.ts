import { PoolClient } from 'pg';

const withTransaction = async function<TResult = void> ({
  getConnection,
  releaseConnection,
  fn
}:
{
  getConnection: () => Promise<PoolClient>;
  releaseConnection?: ({ connection }: { connection: PoolClient }) => Promise<void>;
  fn: ({ connection }: { connection: PoolClient }) => Promise<TResult>;
}): Promise<TResult> {
  const connection = await getConnection();

  let result: TResult;

  try {
    await connection.query('BEGIN');

    result = await fn({ connection });

    await connection.query('COMMIT');
  } catch (ex) {
    await connection.query('ROLLBACK');
    throw ex;
  } finally {
    if (releaseConnection) {
      await releaseConnection({ connection });
    }
  }

  return result;
};

export { withTransaction };
