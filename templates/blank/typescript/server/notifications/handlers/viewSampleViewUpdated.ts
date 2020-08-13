import { ViewUpdated } from '../definitions/ViewUpdated';
import { Infrastructure } from '../../infrastructure';
import { NotificationHandler } from 'wolkenkit';

const viewSampleViewUpdated: NotificationHandler<ViewUpdated, Infrastructure> = {
  isAuthorized (): boolean {
    return true;
  }
};

export { viewSampleViewUpdated };
