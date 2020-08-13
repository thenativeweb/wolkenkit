import { Infrastructure } from '../../infrastructure';
import { NotificationHandler } from 'wolkenkit';
import { ViewUpdated } from '../definitions/ViewUpdated';

const viewSampleViewUpdated: NotificationHandler<ViewUpdated, Infrastructure> = {
  isAuthorized (): boolean {
    return true;
  }
};

export { viewSampleViewUpdated };
