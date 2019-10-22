import Aggregate from '../../lib/common/domain/Aggregate';
import AggregateApiForCommands from '../../lib/common/domain/AggregateApiForCommands';
import AggregateApiForReadOnly from '../../lib/common/domain/AggregateApiForReadOnly';
import Command from '../../lib/common/elements/Command';
import { CommandData } from '../../lib/common/elements/CommandData';
import { DomainEventData } from '../../lib/common/elements/DomainEventData';
import Event from '../../lib/common/elements/DomainEvent';
import { Readable } from 'stream';
import { JSONSchema4 as Schema } from 'json-schema';

export { Aggregate, AggregateApiForCommands, AggregateApiForReadOnly, Command, Event, Schema };

/* eslint-disable class-methods-use-this, no-console */
export abstract class EventHandler<TState, TEventData extends DomainEventData> {
  public abstract getDocumentation (): string;

  public abstract getSchema (): Schema;

  public abstract handle (state: TState, event: Event<TEventData>, service: Services): Partial<TState>;

  public abstract isAuthorized (state: TState, event: Event<TEventData>, service: Services): boolean | Promise<boolean>;

  public abstract filter (state: TState, event: Event<TEventData>, service: Services): boolean | Promise<boolean>;

  public abstract map (state: TState, event: Event<TEventData>, service: Services): Event<TEventData> | Promise<Event<TEventData>>;
}

export abstract class CommandHandler<TState, TCommandData extends CommandData> {
  public abstract getDocumentation (): string;

  public abstract getSchema (): Schema;

  public abstract isAuthorized (state: TState, command: Command<TCommandData>, service: Services): boolean | Promise<boolean>;

  public abstract handle (state: TState, command: Command<TCommandData>, service: Services): void | Promise<void>;
}

export class Services {
  public aggregate = {
    id: '3ddbaa27-e72f-4912-a273-77a177935b67',

    exists (): boolean {
      return true;
    },

    publishEvent <TEventData extends DomainEventData> (eventName: string, data: TEventData): void {
      // ...
    }
  };

  public logger = {
    debug (message: string): void {
      console.log(message);
    },
    info (message: string): void {
      console.log(message);
    },
    warn (message: string): void {
      console.log(message);
    },
    error (message: string): void {
      console.log(message);
    },
    fatal (message: string): void {
      console.log(message);
    }
  };
}

export abstract class ProjectionHandler<TEventData extends DomainEventData> {
  public eventIdentifier: string;

  public constructor (eventIdentifier: string) {
    this.eventIdentifier = eventIdentifier;
  }

  public abstract handle (table: any, event: Event<TEventData>): void | Promise<void>;
}

export abstract class ViewStore<TDatabaseView> {
  public abstract setup (databaseView: TDatabaseView): void | Promise<void>;
}

export abstract class QueryHandler<TDatabaseView, TQueryOptions, TResult> {
  public abstract getDocumentation (): string;

  public abstract getOptionsSchema (): Schema;

  public abstract getItemSchema (): Schema;

  public abstract handle (databaseView: TDatabaseView, queryOptions: TQueryOptions, services: Services): Readable | Promise<Readable>;

  public abstract isAuthorized (databaseViewItem: TResult, services: Services): boolean | Promise<boolean>;
}
/* eslint-enable class-methods-use-this, no-console */
