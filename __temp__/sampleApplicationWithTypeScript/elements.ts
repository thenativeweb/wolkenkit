import { JSONSchema4 as Schema } from 'json-schema';
import { Readable } from 'stream';

export { Schema };

/* eslint-disable class-methods-use-this, no-console */
export class Event<TEventData> {
  public constructor (
    public eventName: string,
    public data: TEventData
  ) {}
}

export abstract class EventHandler<TState, TEventData> {
  public abstract getDocumentation (): string;

  public abstract getSchema (): Schema;

  public abstract handle (aggregate: Aggregate<TState>, event: Event<TEventData>, service: Services): Partial<TState>;

  public abstract isAuthorized (game: Aggregate<TState>, event: Event<TEventData>, service: Services): boolean | Promise<boolean>;

  public abstract filter (game: Aggregate<TState>, event: Event<TEventData>, service: Services): boolean | Promise<boolean>;

  public abstract map (game: Aggregate<TState>, event: Event<TEventData>, service: Services): Event<TEventData> | Promise<Event<TEventData>>;
}

export class Aggregate<TState> {
  public constructor (
    public id: string,
    public state: TState,
    public uncommittedEvents: Event<any>[]
  ) {}

  public exists (): boolean {
    return true;
  }

  public publishEvent<TEventData extends {}> (eventName: string, eventData: TEventData): void {
    const event = new Event<TEventData>(eventName, eventData);

    this.uncommittedEvents.push(event);
  }
}

export class Command<TCommandData> {
  public constructor (
    public data: TCommandData
  ) {}
}

export abstract class CommandHandler<TState, TCommandData> {
  public abstract getDocumentation (): string;

  public abstract getSchema (): Schema;

  public abstract isAuthorized (game: Aggregate<TState>, command: Command<TCommandData>, service: Services): boolean | Promise<boolean>;

  public abstract handle (aggregate: Aggregate<TState>, command: Command<TCommandData>, service: Services): void | Promise<void>;
}

export class Services {
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

export abstract class ProjectionHandler<TEventData> {
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
