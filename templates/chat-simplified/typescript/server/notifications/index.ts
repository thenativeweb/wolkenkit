import { Infrastructure } from '../infrastructure';
import { NotificationDefinition, NotificationHandler, Notifications } from 'wolkenkit';

export interface FlowUpdated extends NotificationDefinition {
  data: {};
  metadata: {};
}

export interface ViewUpdated extends NotificationDefinition {
  data: {};
  metadata: {};
}

const notifications: Notifications = {
  flowMessagesUpdated: {
    isAuthorized (): boolean {
      return true;
    }
  } as NotificationHandler<FlowUpdated, Infrastructure>,
  viewMessagesUpdated: {
    isAuthorized (): boolean {
      return true;
    }
  } as NotificationHandler<ViewUpdated, Infrastructure>
};

export default notifications;
