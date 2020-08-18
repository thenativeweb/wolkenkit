import { ViewUpdatedNotificationDefinition } from '../definitions/ViewUpdatedNotificationDefinition';
import { Infrastructure } from '../../infrastructure';
// @ts-ignore
import { NotificationHandler } from 'wolkenkit';

const viewSampleViewUpdatedNotificationHandler: NotificationHandler<ViewUpdatedNotificationDefinition, Infrastructure> = {
  isAuthorized (): boolean {
    return true;
  }
}

export { viewSampleViewUpdatedNotificationHandler };
