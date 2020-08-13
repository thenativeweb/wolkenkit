import { flowSampleFlowUpdated } from './handlers/flowSampleFlowUpdated';
import { Notifications } from 'wolkenkit';
import { viewSampleViewUpdated } from './handlers/viewSampleViewUpdated';

const notifications: Notifications = {
  flowSampleFlowUpdated,
  viewSampleViewUpdated
};

export default notifications;
