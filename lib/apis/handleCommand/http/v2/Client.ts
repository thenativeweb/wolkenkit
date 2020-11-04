import axios from 'axios';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDescription } from '../../../../common/application/CommandDescription';
import { ContextIdentifier } from '../../../../common/elements/ContextIdentifier';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';

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

  public async getDescription (): Promise<Record<string, Record<string, Record<string, CommandDescription>>>> {
    const { data } = await axios({
      method: 'get',
      url: `${this.url}/description`,
      validateStatus (): boolean {
        return true;
      }
    });

    return data;
  }

  public async postCommand ({ command }: {
    command: {
      contextIdentifier: ContextIdentifier;
      aggregateIdentifier: {
        name: string;
        id?: string;
      };
      name: string;
      data: CommandData;
    };
  }): Promise<{ id: string; aggregateIdentifier: { id: string }}> {
    const url = command.aggregateIdentifier.id ?
      `${this.url}/${command.contextIdentifier.name}/${command.aggregateIdentifier.name}/${command.aggregateIdentifier.id}/${command.name}` :
      `${this.url}/${command.contextIdentifier.name}/${command.aggregateIdentifier.name}/${command.name}`;

    const { status, data } = await axios({
      method: 'post',
      url,
      data: command.data,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return {
        id: data.id,
        aggregateIdentifier: {
          id: data.aggregateIdentifier.id
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
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }

  public async cancelCommand ({ commandIdentifier }: {
    commandIdentifier: ItemIdentifier;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/cancel`,
      data: commandIdentifier,
      validateStatus (): boolean {
        return true;
      }
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
            throw new errors.UnknownError();
          }
        }
      }
      case 404: {
        throw new errors.ItemNotFound(data.message);
      }
      default: {
        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };
