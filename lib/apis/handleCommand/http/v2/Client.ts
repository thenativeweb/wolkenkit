import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDescription } from '../../../../common/application/CommandDescription';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
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

  public async getDescription (): Promise<Record<string, Record<string, Record<string, CommandDescription>>>> {
    const { data } = await this.axios({
      method: 'get',
      url: `${this.url}/description`
    });

    return data;
  }

  public async postCommand ({ command }: {
    command: {
      aggregateIdentifier: {
        context: {
          name: string;
        };
        aggregate: {
          name: string;
          id?: string;
        };
      };
      name: string;
      data: CommandData;
    };
  }): Promise<{ id: string; aggregateIdentifier: { id: string }}> {
    const url = command.aggregateIdentifier.aggregate.id ?
      `${this.url}/${command.aggregateIdentifier.context.name}/${command.aggregateIdentifier.aggregate.name}/${command.aggregateIdentifier.aggregate.id}/${command.name}` :
      `${this.url}/${command.aggregateIdentifier.context.name}/${command.aggregateIdentifier.aggregate.name}/${command.name}`;

    const { status, data } = await this.axios({
      method: 'post',
      url,
      data: command.data
    });

    if (status === 200) {
      return {
        id: data.id,
        aggregateIdentifier: {
          id: data.aggregateIdentifier.aggregate.id
        }
      };
    }

    switch (data.code) {
      case errors.NotAuthenticated.code: {
        throw new errors.NotAuthenticated(data.message);
      }
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
          withLogMetadata('api-client', 'handleCommand', { ex: data, status })
        );

        throw new errors.UnknownError();
      }
    }
  }

  public async cancelCommand ({ commandIdentifier }: {
    commandIdentifier: ItemIdentifier;
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/cancel`,
      data: commandIdentifier
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
          withLogMetadata('api-client', 'handleCommand', { ex: data, status })
        );

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };
