// @ts-ignore
import { NotificationsDefinition } from 'wolkenkit';
import { flowSampleFlowUpdatedNotificationHandler } from './handlers/flowSampleFlowUpdatedNotificationHandler';
import { viewSampleViewUpdatedNotificationHandler } from './handlers/viewSampleViewUpdatedNotificationHandler';

const notifications: NotificationsDefinition = {
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
}

export default notifications;
