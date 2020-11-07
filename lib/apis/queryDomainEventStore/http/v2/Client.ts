import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import axios from 'axios';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsTransform } from '../../../../common/utils/http/FilterHeartbeatsTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ParseJsonTransform } from '../../../../common/utils/http/ParseJsonTransform';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';
import { State } from '../../../../common/elements/State';
import { toArray } from 'streamtoarray';
import { PassThrough, pipeline } from 'stream';

const logger = flaschenpost.getLogger();

class Client extends HttpClient {
  public constructor ({ protocol = 'http', hostName, port, path = '/' }: {
    protocol?: string;
    hostName: string;
    port: number;
    path?: string;
  }) {
    super({ protocol, hostName, port, path });
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const { data, status } = await axios({
      method: 'get',
      url: `${this.url}/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
      validateStatus (): boolean {
        return true;
      }
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
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError(data.message);
      }
    }
  }

  public async getDomainEventsByCausationId ({ causationId }: {
    causationId: string;
  }): Promise<PassThrough> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/domain-events-by-causation-id?causation-id=${causationId}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { ex: data, status });

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

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/has-domain-events-with-causation-id?causation-id=${causationId}`,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: data, status });

      throw new errors.UnknownError(data.message);
    }

    return data.hasDomainEventsWithCausationId;
  }

  public async getDomainEventsByCorrelationId ({ correlationId }: {
    correlationId: string;
  }): Promise<PassThrough> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/domain-events-by-correlation-id?correlation-id=${correlationId}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: data, status });

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

  public async getReplay ({ fromTimestamp = 0 }: {
    fromTimestamp?: number;
  }): Promise<PassThrough> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/replay?fromTimestamp=${fromTimestamp}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: Buffer.concat(await toArray(data)).toString(), status });

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

  public async getReplayForAggregate ({ aggregateId, fromRevision = 1, toRevision = (2 ** 31) - 1 }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<PassThrough> {
    if (fromRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`);
    }
    if (toRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`);
    }
    if (toRevision < fromRevision) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
    }

    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/replay/${aggregateId}/?fromRevision=${fromRevision}&toRevision=${toRevision}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { error: data, status });

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

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const { data, status } = await axios({
      method: 'get',
      url: `${this.url}/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return data;
    }

    if (status === 404) {
      return;
    }

    switch (data.code) {
      case errors.AggregateIdentifierMalformed.code: {
        throw new errors.AggregateIdentifierMalformed(data.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError(data.message);
      }
    }
  }
}

export { Client };
