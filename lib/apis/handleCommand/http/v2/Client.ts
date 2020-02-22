import axios from 'axios';
import { Command } from '../../../../common/elements/Command';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDescription } from '../../../../common/application/CommandDescription';
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
    command: Command<CommandData>;
  }): Promise<{ id: string }> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/`,
      data: command,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return { id: data.id };
    }

    switch (data.code) {
      case 'ENOTAUTHENTICATEDERROR': {
        throw new errors.NotAuthenticatedError(data.message);
      }
      case 'ECOMMANDMALFORMED': {
        throw new errors.CommandMalformed(data.message);
      }
      case 'ECONTEXTNOTFOUND': {
        throw new errors.ContextNotFound(data.message);
      }
      case 'EAGGREGATENOTFOUND': {
        throw new errors.AggregateNotFound(data.message);
      }
      case 'ECOMMANDNOTFOUND': {
        throw new errors.CommandNotFound(data.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };
