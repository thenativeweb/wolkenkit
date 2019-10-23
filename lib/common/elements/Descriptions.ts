import { Schema } from '../elements/Schema';

// Command descriptions.
export interface CommandDescription {
  documentation?: string;
  schema?: Schema;
}

export interface CommandsAggregateDescription {
  commands: Record<string, CommandDescription>;
}

export interface CommandsContextDescription {
  aggregates: Record<string, CommandsAggregateDescription>;
}

export interface CommandsDomainDescription {
  domain: {
    contexts: Record<string, CommandsContextDescription>;
  };
}

// Domain event descriptions.
export interface DomainEventDescription {
  documentation?: string;
  schema?: Schema;
}

export interface DomainEventsAggregateDescription {
  domainEvents: Record<string, DomainEventDescription>;
}

export interface DomainEventsContextDescription {
  aggregates: Record<string, DomainEventsAggregateDescription>;
}

export interface DomainEventsDomainDescription {
  domain: {
    contexts: Record<string, DomainEventsContextDescription>;
  };
}

// View descriptions.
export interface QueryDescription {
  documentation?: string;
  optionsSchema?: Schema;
  itemSchema?: Schema;
}

export interface ViewDescription {
  queries: Record<string, QueryDescription>;
}

export interface ViewsDescription {
  views: Record<string, ViewDescription>;
}

// Application description.
export interface ApplicationDescription {
  commandsDescription: CommandsDomainDescription;
  domainEventsDescription: DomainEventsDomainDescription;
  viewsDescription: ViewsDescription;
}
