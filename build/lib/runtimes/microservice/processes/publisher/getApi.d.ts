import { Configuration } from './Configuration';
import { OnReceiveMessage } from '../../../../apis/publishMessage/OnReceiveMessage';
import { PublishMessage } from '../../../../apis/subscribeMessages/PublishMessage';
import { Application } from 'express';
declare const getApi: ({ configuration, onReceiveMessage }: {
    configuration: Configuration;
    onReceiveMessage: OnReceiveMessage;
}) => Promise<{
    api: Application;
    publishMessage: PublishMessage;
}>;
export { getApi };
