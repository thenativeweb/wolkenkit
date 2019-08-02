import AggregateApiForEvents from '../../elements/AggregateApiForEvents';
import AggregateApiForReadOnly from '../../elements/AggregateApiForReadOnly';
import EventExternal from '../../elements/EventExternal';
import EventInternal from '../../elements/EventInternal';
import { IEventConfigurationExternal } from './IEventConfigurationExternal';
import { IServices } from '../../services/types/IServices';

export interface IEventConfigurationInternal extends IEventConfigurationExternal {
  handle (aggregate: AggregateApiForEvents, event: EventExternal, services: IServices): void | Promise<void>;
  isAuthorized (aggregate: AggregateApiForReadOnly, event: EventInternal, services: IServices): boolean | Promise<boolean>;
  filter? (aggregate: AggregateApiForReadOnly, event: EventInternal, services: IServices): boolean | Promise<boolean>;
  map? (aggregate: AggregateApiForReadOnly, event: EventInternal, services: IServices): EventInternal | Promise<EventInternal>;
}
