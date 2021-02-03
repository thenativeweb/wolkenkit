import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { IsReplaying } from '../IsReplaying';
import { SqlServerConsumerProgressStoreOptions } from './SqlServerConsumerProgressStoreOptions';
import { TableNames } from './TableNames';
import { ConnectionPool, RequestError, TYPES as Types } from 'mssql';

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
  }: SqlServerConsumerProgressStoreOptions): Promise<SqlServerConsumerProgressStore> {
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

    return new SqlServerConsumerProgressStore({ pool, tableNames });
  }

  public async getProgress ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<{ revision: number; isReplaying: IsReplaying }> {
    const request = this.pool.request();
    const hash = getHash({ value: consumerId });

    request.input('consumerId', Types.NChar, hash);
    request.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.aggregate.id);

    const { recordset } = await request.query(`
      SELECT [revision], [isReplayingFrom], [isReplayingTo]
        FROM [${this.tableNames.progress}]
        WHERE [consumerId] = @consumerId AND [aggregateId] = @aggregateId;
    `);

    if (recordset.length === 0) {
      return { revision: 0, isReplaying: false };
    }

    const { revision, isReplayingFrom, isReplayingTo } = recordset[0];

    const isReplaying = isReplayingFrom ?
      { from: isReplayingFrom, to: isReplayingTo } :
      false;

    return { revision, isReplaying };
  }

  public async setProgress ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    if (revision < 0) {
      throw new errors.ParameterInvalid('Revision must be at least zero.');
    }

    const hash = getHash({ value: consumerId });

    const transaction = this.pool.transaction();

    await transaction.begin();

    try {
      const requestUpdate = transaction.request();

      requestUpdate.input('revision', Types.Int, revision);
      requestUpdate.input('consumerId', Types.NChar, hash);
      requestUpdate.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.aggregate.id);

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
        requestInsert.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.aggregate.id);
        requestInsert.input('revision', Types.Int, revision);

        await requestInsert.query(`
          INSERT INTO [${this.tableNames.progress}]
            ([consumerId], [aggregateId], [revision], [isReplayingFrom], [isReplayingTo])
            VALUES (@consumerId, @aggregateId, @revision, NULL, NULL);
        `);
      } catch (ex: unknown) {
        if (
          ex instanceof RequestError &&
          ex.code === 'EREQUEST' &&
          ex.number === 2_627 &&
          ex.message.startsWith('Violation of PRIMARY KEY constraint')
        ) {
          throw new errors.RevisionTooLow();
        }

        throw ex;
      }

      await transaction.commit();
    } catch (ex: unknown) {
      await transaction.rollback();
      throw ex;
    }
  }

  public async setIsReplaying ({ consumerId, aggregateIdentifier, isReplaying }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    isReplaying: IsReplaying;
  }): Promise<void> {
    if (isReplaying) {
      if (isReplaying.from < 1) {
        throw new errors.ParameterInvalid('Replays must start from at least one.');
      }
      if (isReplaying.from > isReplaying.to) {
        throw new errors.ParameterInvalid('Replays must start at an earlier revision than where they end at.');
      }
    }

    const hash = getHash({ value: consumerId });

    const transaction = this.pool.transaction();

    await transaction.begin();

    try {
      const requestUpdate = transaction.request();

      requestUpdate.input('consumerId', Types.NChar, hash);
      requestUpdate.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.aggregate.id);
      requestUpdate.input('isReplayingFrom', Types.Int, isReplaying ? isReplaying.from : null);
      requestUpdate.input('isReplayingTo', Types.Int, isReplaying ? isReplaying.to : null);

      const { rowsAffected } = await (isReplaying ?
        requestUpdate.query(`
          UPDATE [${this.tableNames.progress}]
            SET
              [isReplayingFrom] = @isReplayingFrom,
              [isReplayingTo] = @isReplayingTo
            WHERE
              [consumerId] = @consumerId AND
              [aggregateId] = @aggregateId AND
              [isReplayingFrom] IS NULL AND
              [isReplayingTo] IS NULL;
        `) :
        requestUpdate.query(`
          UPDATE [${this.tableNames.progress}]
            SET
              [isReplayingFrom] = @isReplayingFrom,
              [isReplayingTo] = @isReplayingTo
            WHERE
              [consumerId] = @consumerId AND
              [aggregateId] = @aggregateId;
        `));

      if (rowsAffected[0] === 1) {
        await transaction.commit();

        return;
      }

      try {
        const requestInsert = transaction.request();

        requestInsert.input('consumerId', Types.NChar, hash);
        requestInsert.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.aggregate.id);
        requestInsert.input('isReplayingFrom', Types.Int, isReplaying ? isReplaying.from : null);
        requestInsert.input('isReplayingTo', Types.Int, isReplaying ? isReplaying.to : null);

        await requestInsert.query(`
          INSERT INTO [${this.tableNames.progress}]
            ([consumerId], [aggregateId], [revision], [isReplayingFrom], [isReplayingTo])
            VALUES (@consumerId, @aggregateId, 0, @isReplayingFrom, @isReplayingTo);
        `);
      } catch (ex: unknown) {
        if (
          ex instanceof RequestError &&
          ex.code === 'EREQUEST' &&
          ex.number === 2_627 &&
          ex.message.startsWith('Violation of PRIMARY KEY constraint')
        ) {
          throw new errors.FlowIsAlreadyReplaying();
        }

        throw ex;
      }

      await transaction.commit();
    } catch (ex: unknown) {
      await transaction.rollback();
      throw ex;
    }
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

  public async resetProgressToRevision ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    if (revision < 0) {
      throw new errors.ParameterInvalid('Revision must be at least zero.');
    }

    const { revision: currentRevision } = await this.getProgress({
      consumerId,
      aggregateIdentifier
    });

    if (currentRevision < revision) {
      throw new errors.ParameterInvalid('Can not reset a consumer to a newer revision than it currently is at.');
    }

    const hash = getHash({ value: consumerId });

    const transaction = this.pool.transaction();

    await transaction.begin();

    try {
      const requestUpdate = transaction.request();

      requestUpdate.input('revision', Types.Int, revision);
      requestUpdate.input('consumerId', Types.NChar, hash);
      requestUpdate.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.aggregate.id);

      const { rowsAffected } = await requestUpdate.query(`
        UPDATE [${this.tableNames.progress}]
          SET [revision] = @revision, [isReplayingFrom] = NULL, [isReplayingTo] = NULL
          WHERE [consumerId] = @consumerId AND [aggregateId] = @aggregateId;
      `);

      if (rowsAffected[0] === 1) {
        await transaction.commit();

        return;
      }

      const requestInsert = transaction.request();

      requestInsert.input('consumerId', Types.NChar, hash);
      requestInsert.input('aggregateId', Types.UniqueIdentifier, aggregateIdentifier.aggregate.id);
      requestInsert.input('revision', Types.Int, revision);

      await requestInsert.query(`
        INSERT INTO [${this.tableNames.progress}]
          ([consumerId], [aggregateId], [revision], [isReplayingFrom], [isReplayingTo])
          VALUES (@consumerId, @aggregateId, @revision, NULL, NULL);
      `);

      await transaction.commit();
    } catch (ex: unknown) {
      await transaction.rollback();
      throw ex;
    }
  }

  public async setup (): Promise<void> {
    try {
      await this.pool.query(`
        IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.tableNames.progress}')
          BEGIN
            CREATE TABLE [${this.tableNames.progress}] (
              [consumerId] NCHAR(64) NOT NULL,
              [aggregateId] UNIQUEIDENTIFIER NOT NULL,
              [revision] INT NOT NULL,
              [isReplayingFrom] INT,
              [isReplayingTo] INT,

              CONSTRAINT [${this.tableNames.progress}_pk] PRIMARY KEY([consumerId], [aggregateId])
            );
          END
      `);
    } catch (ex: unknown) {
      if (!/There is already an object named.*_progress/u.exec((ex as Error).message)) {
        throw ex;
      }

      // When multiple clients initialize at the same time, e.g. during
      // integration tests, SQL Server might throw an error. In this case we
      // simply ignore it.
    }
  }

  public async destroy (): Promise<void> {
    await this.pool.close();
  }
}

export { SqlServerConsumerProgressStore };
