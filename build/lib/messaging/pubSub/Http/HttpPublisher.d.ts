import { Client } from '../../../apis/publishMessage/http/v2/Client';
import { HttpPublisherOptions } from './HttpPublisherOptions';
import { Publisher } from '../Publisher';
declare class HttpPublisher<T extends object> implements Publisher<T> {
    protected publisherClient: Client;
    protected constructor({ publisherClient }: {
        publisherClient: Client;
    });
    static create<TCreate extends object>(options: HttpPublisherOptions): Promise<HttpPublisher<TCreate>>;
    publish({ channel, message }: {
        channel: string;
        message: T;
    }): Promise<void>;
}
export { HttpPublisher };
