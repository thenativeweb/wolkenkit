import axios from 'axios';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';

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

  public async postDomainEvent ({ flowNames, domainEvent }: {
    flowNames?: string[];
    domainEvent: DomainEvent<DomainEventData>;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/`,
      data: { flowNames, domainEvent },
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case 'EFLOWNOTFOUND': {
        throw new errors.FlowNotFound(data.message);
      }
      case 'EDOMAINEVENTMALFORMED': {
        throw new errors.DomainEventMalformed(data.message);
      }
      case 'ECONTEXTNOTFOUND': {
        throw new errors.ContextNotFound(data.message);
      }
      case 'EAGGREGATENOTFOUND': {
        throw new errors.AggregateNotFound(data.message);
      }
      case 'EDOMAINEVENTNOTFOUND': {
        throw new errors.DomainEventNotFound(data.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };
