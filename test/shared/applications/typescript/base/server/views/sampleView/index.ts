import { all } from './queries/all';
import { flowSampleFlowUpdatedNotificationSubscriber } from './notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber';
// @ts-ignore
import { View } from 'wolkenkit';

const sampleView: View = {
  queryHandlers: {
    all
  },
  notificationSubscribers: {
    flowSampleFlowUpdatedNotificationSubscriber
  }
};

export default sampleView;
