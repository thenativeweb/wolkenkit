import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsTransform } from '../../../../common/utils/http/FilterHeartbeatsTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ParseJsonTransform } from '../../../../common/utils/http/ParseJsonTransform';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';
import { State } from '../../../../common/elements/State';
import streamToString from 'stream-to-string';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { PassThrough, pipeline, Readable } from 'stream';

const logger = flaschenpost.getLogger();

class Client extends HttpClient {
  public constructor ({ protocol = 'http', hostName, portOrSocket, path = '/' }: {
    protocol?: string;
    hostName: string;
    portOrSocket: number | string;
    path?: string;
  }) {
    super({ protocol, hostName, portOrSocket, path });
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
    });

    if (status === 200) {
      return new DomainEvent(data);
    }

    if (status === 404) {
      return;
    }

    switch (data.code) {
      case errors.AggregateIdentifierMalformed.code: {
        throw new errors.AggregateIdentifierMalformed(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status })
        );

        throw new errors.UnknownError(data.message);
      }
    }
  }

  public async getDomainEventsByCausationId ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/domain-events-by-causation-id?causation-id=${causationId}`,
      responseType: 'stream'
    });

    if (status !== 200) {
      logger.error(
        'An unknown error occured.',
        withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status })
      );

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const jsonParser = new ParseJsonTransform();
    const heartbeatFilter = new FilterHeartbeatsTransform();

    return pipeline(
      data,
      jsonParser,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error(
            'An error occured during stream piping.',
            withLogMetadata('api-client', 'queryDomainEventStore', { err })
          );
        }
      }
    );
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/has-domain-events-with-causation-id?causation-id=${causationId}`
    });

    if (status !== 200) {
      logger.error(
        'An unknown error occured.',
        withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status })
      );

      throw new errors.UnknownError(data.message);
    }

    return data.hasDomainEventsWithCausationId;
  }

  public async getDomainEventsByCorrelationId ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/domain-events-by-correlation-id?correlation-id=${correlationId}`,
      responseType: 'stream'
    });

    if (status !== 200) {
      logger.error(
        'An unknown error occured.',
        withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status })
      );

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const jsonParser = new ParseJsonTransform();
    const heartbeatFilter = new FilterHeartbeatsTransform();

    return pipeline(
      data,
      jsonParser,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error(
            'An error occured during stream piping.',
            withLogMetadata('api-client', 'queryDomainEventStore', { err })
          );
        }
      }
    );
  }

  public async getReplay ({ fromTimestamp = 0 }: {
    fromTimestamp?: number;
  }): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/replay?fromTimestamp=${fromTimestamp}`,
      responseType: 'stream'
    });

    if (status !== 200) {
      logger.error(
        'An unknown error occured.',
        withLogMetadata(
          'api-client',
          'queryDomainEventStore',
          { error: JSON.parse(await streamToString(data)), status }
        )
      );

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const jsonParser = new ParseJsonTransform();
    const heartbeatFilter = new FilterHeartbeatsTransform();

    return pipeline(
      data,
      jsonParser,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error(
            'An error occured during stream piping.',
            withLogMetadata('api-client', 'queryDomainEventStore', { err })
          );
        }
      }
    );
  }

  public async getReplayForAggregate ({ aggregateId, fromRevision = 1, toRevision = (2 ** 31) - 1 }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<Readable> {
    if (fromRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`);
    }
    if (toRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`);
    }
    if (toRevision < fromRevision) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
    }

    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/replay/${aggregateId}/?fromRevision=${fromRevision}&toRevision=${toRevision}`,
      responseType: 'stream'
    });

    if (status !== 200) {
      logger.error(
        'An unknown error occured.',
        withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status })
      );

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const jsonParser = new ParseJsonTransform();
    const heartbeatFilter = new FilterHeartbeatsTransform();

    return pipeline(
      data,
      jsonParser,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error(
            'An error occured during stream piping.',
            withLogMetadata('api-client', 'queryDomainEventStore', { err })
          );
        }
      }
    );
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
    });

    if (status === 200) {
      return data;
    }

    switch (data.code) {
      case errors.SnapshotNotFound.code: {
        return;
      }
      case errors.AggregateIdentifierMalformed.code: {
        throw new errors.AggregateIdentifierMalformed(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status })
        );

        throw new errors.UnknownError(data.message);
      }
    }
  }

  public async getAggregateIdentifiers (): Promise<Readable> {
    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/get-aggregate-identifiers`,
      responseType: 'stream'
    });

    if (status !== 200) {
      const error = JSON.parse(await streamToString(data));

      logger.error('An unknown error occured.', { error: error, status });

      throw new errors.UnknownError();
    }

    const passThrough = new PassThrough({ objectMode: true });
    const jsonParser = new ParseJsonTransform();
    const heartbeatFilter = new FilterHeartbeatsTransform();

    return pipeline(
      data,
      jsonParser,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error('An error occured during stream piping.', { err });
        }
      }
    );
  }

  public async getAggregateIdentifiersByName ({ contextName, aggregateName }: {
    contextName: string;
    aggregateName: string;
  }): Promise<Readable> {
    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/get-aggregate-identifiers-by-name?contextName=${contextName}&aggregateName=${aggregateName}`,
      responseType: 'stream'
    });

    if (status !== 200) {
      const error = JSON.parse(await streamToString(data));

      logger.error('An unknown error occured.', { error: error, status });

      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const jsonParser = new ParseJsonTransform();
    const heartbeatFilter = new FilterHeartbeatsTransform();

    return pipeline(
      data,
      jsonParser,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error('An error occured during stream piping.', { err });
        }
      }
    );
  }
}

export { Client };
