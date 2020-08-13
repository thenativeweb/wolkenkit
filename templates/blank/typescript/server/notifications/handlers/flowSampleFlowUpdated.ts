import { FlowUpdated } from '../definitions/FlowUpdated';
import { Infrastructure } from '../../infrastructure';
import { NotificationHandler } from 'wolkenkit';

const flowSampleFlowUpdated: NotificationHandler<FlowUpdated, Infrastructure> = {
  isAuthorized (): boolean {
    return true;
  }
};

export { flowSampleFlowUpdated };
