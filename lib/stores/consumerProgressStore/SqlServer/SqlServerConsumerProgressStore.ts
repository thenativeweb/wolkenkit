import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { TableNames } from './TableNames';
import { ConnectionPool, Transaction, TYPES as Types } from 'mssql';

class SqlServerConsumerProgressStore implements ConsumerProgressStore {
  protected pool: ConnectionPool;

  protected tableNames: TableNames;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected constructor ({ pool, tableNames }: {
    pool: ConnectionPool;
    tableNames: TableNames;
  }) {
    this.pool = pool;
    this.tableNames = tableNames;
  }

  public static async create ({
    hostName,
    port,
    userName,
    password,
    database,
    encryptConnection = false,
    tableNames
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
  }): Promise<SqlServerConsumerProgressStore> {
    const pool = new ConnectionPool({
      server: hostName,
      port,
      user: userName,
      password,
      database,
      options: {
        enableArithAbort: true,
        encrypt: encryptConnection,
        trustServerCertificate: false
      }
    });

    pool.on('error', (): void => {
      SqlServerConsumerProgressStore.onUnexpectedClose();
    });

    await pool.connect();

    try {
      await pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${tableNames.progress}')
          BEGIN
            CREATE TABLE [${tableNames.progress}] (
              [consumerId] NCHAR(64) NOT NULL,
              [aggregateId] UNIQUEIDENTIFIER NOT NULL,
              [revision] INT NOT NULL,

              CONSTRAINT [${tableNames.progress}_pk] PRIMARY KEY([consumerId], [aggregateId])
            );
          END
      `);
    } catch (ex) {
      if (!/There is already an object named.*_progress/u.exec(ex.message)) {
        throw ex;
      }

      // When multiple clients initialize at the same time, e.g. during
      // integration tests, SQL Server might throw an error. In this case we
      // simply ignore it.
    }

    return new SqlServerConsumerProgressStore({ pool, tableNames });
  }

  public async getProgress ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<number> {
    const request = this.pool.request();
    const hash = getHash({ value: consumerId });

    request.input('consumerId', Types.NChar, hash);
    request.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.id);

    const { recordset } = await request.query(`
      SELECT [revision]
        FROM [${this.tableNames.progress}]
        WHERE [consumerId] = @consumerId AND [aggregateId] = @aggregateId;
    `);

    if (recordset.length === 0) {
      return 0;
    }

    return recordset[0].revision;
  }

  public async setProgress ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    const hash = getHash({ value: consumerId });

    const transaction = this.pool.transaction();

    await transaction.begin();

    try {
      const requestUpdate = transaction.request();

      requestUpdate.input('revision', Types.Int, revision);
      requestUpdate.input('consumerId', Types.NChar, hash);
      requestUpdate.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.id);

      const { rowsAffected } = await requestUpdate.query(`
        UPDATE [${this.tableNames.progress}]
          SET [revision] = @revision
          WHERE [consumerId] = @consumerId AND [aggregateId] = @aggregateId AND [revision] < @revision;
      `);

      if (rowsAffected[0] === 1) {
        await transaction.commit();

        return;
      }

      try {
        const requestInsert = transaction.request();

        requestInsert.input('consumerId', Types.NChar, hash);
        requestInsert.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.id);
        requestInsert.input('revision', Types.Int, revision);

        await requestInsert.query(`
          INSERT INTO [${this.tableNames.progress}]
            ([consumerId], [aggregateId], [revision])
            VALUES (@consumerId, @aggregateId, @revision);
        `);
      } catch (ex) {
        if (ex.code === 'EREQUEST' && ex.number === 2627 && ex.message.startsWith('Violation of PRIMARY KEY constraint')) {
          throw new errors.RevisionTooLow();
        }

        throw ex;
      }

      await transaction.commit();
    } catch (ex) {
      await transaction.rollback();
      throw ex;
    }




    request.input('consumerId', Types.NChar, hash);

    await request.query(`
      DELETE FROM [${this.tableNames.progress}]
        WHERE [consumerId] = @consumerId;
    `);
  }

  public async resetProgress ({ consumerId }: {
    consumerId: string;
  }): Promise<void> {
    const request = this.pool.request();
    const hash = getHash({ value: consumerId });

    request.input('consumerId', Types.NChar, hash);

    await request.query(`
      DELETE FROM [${this.tableNames.progress}]
        WHERE [consumerId] = @consumerId;
    `);
  }

  public async destroy (): Promise<void> {
    await this.pool.close();
  }
}

export { SqlServerConsumerProgressStore };
