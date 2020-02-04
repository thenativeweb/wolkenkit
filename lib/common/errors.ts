import { defekt } from 'defekt';

const errors = defekt({
  AggregateDefinitionMalformed: {},
  AggregateIdentifierMalformed: {},
  AggregateNotFound: {},
  ApplicationNotFound: {},
  CommandHandlerMalformed: {},
  CommandMalformed: {},
  CommandNotFound: {},
  CommandRejected: {},
  CompilationFailed: {},
  ContentTypeMismatch: {},
  ContextNotFound: {},
  CorsOriginInvalid: {},
  DatabaseTypeInvalid: {},
  DirectoryNotFound: {},
  DispatchFailed: {},
  DomainEventAlreadyExists: {},
  DomainEventHandlerMalformed: {},
  DomainEventNotAuthorized: {},
  DomainEventNotFound: {},
  DomainEventMalformed: {},
  DomainEventRejected: {},
  DomainEventUnknown: {},
  FileAlreadyExists: {},
  FileNotFound: {},
  IdentifierMismatch: {},
  InvalidOperation: {},
  ItemAlreadyExists: {},
  ItemIdentifierMalformed: {},
  ItemIdentifierNotFound: {},
  ItemNotFound: {},
  ItemNotLocked: {},
  LockExpired: {},
  NotAuthenticatedError: {},
  ParameterInvalid: {},
  ProjectionHandlerMalformed: {},
  PublisherTypeInvalid: {},
  QueryHandlerMalformed: {},
  RequestFailed: {},
  RequestMalformed: {},
  RevisionAlreadyExists: {},
  SnapshotMalformed: {},
  SubscriberTypeInvalid: {},
  TokenMismatch: {},
  TypeInvalid: {},
  UnknownError: {},
  ViewDefinitionMalformed: {}
});

export { errors };
