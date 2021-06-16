import { AskInfrastructure } from '../elements/AskInfrastructure';
import { Notifications } from '../elements/Notifications';
import { NotificationsDescription } from './NotificationsDescription';
import { TellInfrastructure } from '../elements/TellInfrastructure';
declare const getNotificationsDescription: ({ notificationsDefinition }: {
    notificationsDefinition: Notifications<AskInfrastructure & TellInfrastructure>;
}) => NotificationsDescription;
export { getNotificationsDescription };
