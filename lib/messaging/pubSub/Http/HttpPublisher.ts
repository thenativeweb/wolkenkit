import { Client } from '../../../apis/publishMessage/http/v2/Client';
import { HttpPublisherOptions } from './HttpPublisherOptions';
import { Publisher } from '../Publisher';

class HttpPublisher<T extends object> implements Publisher<T> {
  protected publisherClient: Client;

  protected constructor ({ publisherClient }: {
    publisherClient: Client;
  }) {
    this.publisherClient = publisherClient;
  }

  public static async create<TCreate extends object> (options: HttpPublisherOptions): Promise<HttpPublisher<TCreate>> {
    const publisherClient = new Client({
      protocol: options.protocol,
      hostName: options.hostName,
      port: options.port,
      path: options.path
    });

    return new HttpPublisher({ publisherClient });
  }

  public async publish ({ channel, message }: {
    channel: string;
    message: T;
  }): Promise<void> {
    await this.publisherClient.postMessage({
      channel,
      message
    });
  }
}

export { HttpPublisher };
