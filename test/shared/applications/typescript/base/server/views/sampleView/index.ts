import { all } from './queries/all';
import { flowSampleFlowUpdatedNotificationSubscriber } from './notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber';
import { Infrastructure } from '../../infrastructure';
// @ts-ignore
import { View } from 'wolkenkit';

const sampleView: View<Infrastructure> = {
  queryHandlers: {
    all
  },
  notificationSubscribers: {
    flowSampleFlowUpdatedNotificationSubscriber
  }
};

export default sampleView;
