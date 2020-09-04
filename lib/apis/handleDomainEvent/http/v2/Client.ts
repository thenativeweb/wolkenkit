import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
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

  public async postDomainEvent ({ flowNames, domainEvent }: {
    flowNames?: string[];
    domainEvent: DomainEvent<DomainEventData>;
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/`,
      data: { flowNames, domainEvent }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case errors.FlowNotFound.code: {
        throw new errors.FlowNotFound(data.message);
      }
      case errors.DomainEventMalformed.code: {
        throw new errors.DomainEventMalformed(data.message);
      }
      case errors.ContextNotFound.code: {
        throw new errors.ContextNotFound(data.message);
      }
      case errors.AggregateNotFound.code: {
        throw new errors.AggregateNotFound(data.message);
      }
      case errors.DomainEventNotFound.code: {
        throw new errors.DomainEventNotFound(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'handleDomainEvent', { ex: data, status })
        );

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };
