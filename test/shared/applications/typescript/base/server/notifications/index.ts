// @ts-ignore
import { Notifications } from 'wolkenkit';
import { flowSampleFlowUpdatedNotificationHandler } from './handlers/flowSampleFlowUpdatedNotificationHandler';
import { viewSampleViewUpdatedNotificationHandler } from './handlers/viewSampleViewUpdatedNotificationHandler';

const notifications: Notifications = {
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
}

export default notifications;
