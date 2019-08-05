import AggregateApiForEvents from '../elements/AggregateApiForEvents';
import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { ClientService } from '../services/ClientService';
import { EventConfigurationExternal } from './EventConfigurationExternal';
import EventExternal from '../elements/EventExternal';
import EventInternal from '../elements/EventInternal';
import { LoggerService } from '../services/LoggerService';

export interface EventConfigurationInternal extends EventConfigurationExternal {
  handle (
    aggregate: AggregateApiForEvents,
    event: EventExternal,
    services: {
      client: ClientService,
      logger: LoggerService
    }
  ): void | Promise<void>;

  isAuthorized (
    aggregate: AggregateApiForReadOnly,
    event: EventInternal,
    services: {
      client: ClientService,
      logger: LoggerService
    }
  ): boolean | Promise<boolean>;

  filter? (
    aggregate: AggregateApiForReadOnly,
    event: EventInternal,
    services: {
      client: ClientService,
      logger: LoggerService
    }
  ): boolean | Promise<boolean>;

  map? (
    aggregate: AggregateApiForReadOnly,
    event: EventInternal,
    services: {
      client: ClientService,
      logger: LoggerService
    }
  ): EventInternal | Promise<EventInternal>;
}
