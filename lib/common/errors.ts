import defekt from 'defekt';

const errors = defekt({
  AggregateDefinitionMalformed: {},
  AggregateNotFound: {},
  ApplicationNotFound: {},
  CommandHandlerMalformed: {},
  CommandMalformed: {},
  CommandNotFound: {},
  CommandRejected: {},
  CompilationFailed: {},
  ContextNotFound: {},
  DatabaseTypeInvalid: {},
  DirectoryNotFound: {},
  DispatchFailed: {},
  DomainEventAlreadyExists: {},
  DomainEventHandlerMalformed: {},
  DomainEventNotFound: {},
  DomainEventMalformed: {},
  DomainEventUnknown: {},
  FileAlreadyExists: {},
  FileNotFound: {},
  ForwardFailed: {},
  IdentifierMismatch: {},
  InvalidOperation: {},
  NotAuthenticatedError: {},
  ProjectionHandlerMalformed: {},
  QueryHandlerMalformed: {},
  RequestFailed: {},
  RequestMalformed: {},
  TypeInvalid: {},
  ViewDefinitionMalformed: {}
});

export { errors };
