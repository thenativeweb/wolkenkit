import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';
import { State } from '../../../../common/elements/State';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

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

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/store-domain-events`,
      data: domainEvents
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case errors.DomainEventMalformed.code: {
        throw new errors.DomainEventMalformed(data.message);
      }
      case errors.ParameterInvalid.code: {
        throw new errors.ParameterInvalid(data.message);
      }
      case errors.RevisionAlreadyExists.code: {
        throw new errors.RevisionAlreadyExists(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'writeDomainEventStore', { error: data, status })
        );
        throw new errors.UnknownError(data.message);
      }
    }
  }

  public async storeSnapshot <TState extends State> ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/store-snapshot`,
      data: snapshot
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case errors.RequestMalformed.code: {
        throw new errors.RequestMalformed(data.message);
      }
      case errors.SnapshotMalformed.code: {
        throw new errors.SnapshotMalformed(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'writeDomainEventStore', { error: data, status })
        );
        throw new errors.UnknownError(data.message);
      }
    }
  }
}

export { Client };
