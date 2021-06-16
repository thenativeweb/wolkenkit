import { AskInfrastructure } from '../elements/AskInfrastructure';
import { Notifications } from '../elements/Notifications';
import { TellInfrastructure } from '../elements/TellInfrastructure';
declare const getNotificationsDefinition: ({ notificationsDirectory }: {
    notificationsDirectory: string;
}) => Promise<Notifications<AskInfrastructure & TellInfrastructure>>;
export { getNotificationsDefinition };
