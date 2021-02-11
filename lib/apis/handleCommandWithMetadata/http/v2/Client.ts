import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
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

  public async postCommand ({ command }: {
    command: CommandWithMetadata<CommandData>;
  }): Promise<{ id: string }> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/`,
      data: command
    });

    if (status === 200) {
      return { id: data.id };
    }

    switch (data.code) {
      case errors.CommandMalformed.code: {
        throw new errors.CommandMalformed(data.message);
      }
      case errors.ContextNotFound.code: {
        throw new errors.ContextNotFound(data.message);
      }
      case errors.AggregateNotFound.code: {
        throw new errors.AggregateNotFound(data.message);
      }
      case errors.CommandNotFound.code: {
        throw new errors.CommandNotFound(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'handleCommandWithMetadata', { err: data, status })
        );

        throw new errors.UnknownError();
      }
    }
  }

  public async cancelCommand ({ commandIdentifierWithClient }: {
    commandIdentifierWithClient: ItemIdentifierWithClient;
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/cancel`,
      data: commandIdentifierWithClient
    });

    switch (status) {
      case 200: {
        return;
      }
      case 400: {
        switch (data.code) {
          case errors.ContextNotFound.code: {
            throw new errors.ContextNotFound(data.message);
          }
          case errors.AggregateNotFound.code: {
            throw new errors.AggregateNotFound(data.message);
          }
          case errors.CommandNotFound.code: {
            throw new errors.CommandNotFound(data.message);
          }
          default: {
            // Intentionally left blank so it falls through to the outher default case.
          }
        }
      }
      // eslint-disable-next-line no-fallthrough
      case 404: {
        throw new errors.ItemNotFound(data.message);
      }
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'handleCommandWithMetadata', { err: data, status })
        );

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };
