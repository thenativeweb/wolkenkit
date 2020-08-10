import { GetNotificationService } from './types/GetNotificationService';
import { NotificationDefinition } from '../elements/NotificationDefinition';
import { NotificationService } from './NotificationService';

const getNotificationService: GetNotificationService = function ({ publishNotification }: {
  publishNotification: (<TNotificationDefinition extends NotificationDefinition>(
    name: string,
    data: TNotificationDefinition['data'],
    metadata?: TNotificationDefinition['metadata']
  ) => void | Promise<void>);
}): NotificationService {
  return {
    publish: publishNotification
  };
};

export { getNotificationService };
