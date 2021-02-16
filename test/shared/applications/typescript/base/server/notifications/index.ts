import { complexNotificationHandler } from './handlers/complexNotificationHandler';
import { flowSampleFlowUpdatedNotificationHandler } from './handlers/flowSampleFlowUpdatedNotificationHandler';
import { Infrastructure } from '../infrastructure';
// @ts-ignore
import { Notifications } from 'wolkenkit';
import { viewSampleViewUpdatedNotificationHandler } from './handlers/viewSampleViewUpdatedNotificationHandler';

const notifications: Notifications<Infrastructure> = {
  complex: complexNotificationHandler,
  flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler,
  viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler
}

export default notifications;
