import { all } from './queries/all';
import { flowSampleFlowUpdatedNotificationSubscriber } from './notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber';
import { View } from 'wolkenkit';

const sampleView: View = {
  queryHandlers: {
    all
  },

  notificationSubscribers: {
    flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationSubscriber
  }
};

export default sampleView;
