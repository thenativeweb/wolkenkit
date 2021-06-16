import { ComplexNotificationDefinition } from "../definitions/ComplexNotificationDefinition";
import { Infrastructure } from '../../infrastructure';
import { NotificationHandler } from 'wolkenkit';
declare const complexNotificationHandler: NotificationHandler<ComplexNotificationDefinition, Infrastructure>;
export { complexNotificationHandler };
