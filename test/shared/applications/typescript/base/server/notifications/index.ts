import { complexNotificationHandler } from "./handlers/complexNotificationHandler";
import { flowSampleFlowUpdatedNotificationHandler } from './handlers/flowSampleFlowUpdatedNotificationHandler';
// @ts-ignore
import { Notifications } from 'wolkenkit';
import { viewSampleViewUpdatedNotificationHandler } from './handlers/viewSampleViewUpdatedNotificationHandler';

const notifications: Notifications = {
  complex: complexNotificationHandler,
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
}

export default notifications;
