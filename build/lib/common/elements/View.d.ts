import { AskInfrastructure } from './AskInfrastructure';
import { CommandData } from './CommandData';
import { NotificationDefinition } from './NotificationDefinition';
import { TellInfrastructure } from './TellInfrastructure';
import { ViewDefinition } from '../application/ViewDefinition';
import { ViewEnhancer } from '../../tools/ViewEnhancer';
interface View<TInfrastructure extends AskInfrastructure & TellInfrastructure, TQueries extends Record<string, CommandData> = Record<string, any>, TNotificationDefinitions extends Record<string, NotificationDefinition> = Record<string, any>> extends ViewDefinition<TInfrastructure, TQueries, TNotificationDefinitions> {
    enhancers?: ViewEnhancer[];
}
export type { View };
