import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import * as errors from '../../../../common/errors';

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

  public async performReplay ({ flowNames, aggregates }: {
    flowNames?: string[];
    aggregates: {
      aggregateIdentifier: AggregateIdentifier;
      from: number;
      to: number;
    }[];
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/`,
      data: { flowNames, aggregates }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case errors.FlowNotFound.code: {
        throw new errors.FlowNotFound(data.message);
      }
      case errors.ContextNotFound.code: {
        throw new errors.ContextNotFound(data.message);
      }
      case errors.AggregateNotFound.code: {
        throw new errors.AggregateNotFound(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'performReplay', { error: data, status })
        );

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };
