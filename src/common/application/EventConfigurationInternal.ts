import AggregateApiForEvents from '../elements/AggregateApiForEvents';
import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { EventConfigurationExternal } from './EventConfigurationExternal';
import EventExternal from '../elements/EventExternal';
import EventInternal from '../elements/EventInternal';
import { Services } from '../services/Services';

export interface EventConfigurationInternal extends EventConfigurationExternal {
  handle (aggregate: AggregateApiForEvents, event: EventExternal, services: Services): void | Promise<void>;
  isAuthorized (aggregate: AggregateApiForReadOnly, event: EventInternal, services: Services): boolean | Promise<boolean>;
  filter? (aggregate: AggregateApiForReadOnly, event: EventInternal, services: Services): boolean | Promise<boolean>;
  map? (aggregate: AggregateApiForReadOnly, event: EventInternal, services: Services): EventInternal | Promise<EventInternal>;
}
