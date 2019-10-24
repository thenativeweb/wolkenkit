import defekt from 'defekt';

const errors = defekt({
  AggregateDefinitionMalformed: {},
  AggregateNotFound: {},
  ApplicationNotFound: {},
  CommandDefinitionMalformed: {},
  CommandMalformed: {},
  CommandNotFound: {},
  CompilationFailed: {},
  ContextNotFound: {},
  DirectoryNotFound: {},
  DispatchFailed: {},
  DomainEventDefinitionInvalid: {},
  DomainEventDefinitionMalformed: {},
  DomainEventMalformed: {},
  DomainEventUnknown: {},
  FileAlreadyExists: {},
  FileNotFound: {},
  ForwardFailed: {},
  IdentifierMismatch: {},
  InvalidOperation: {},
  NotAuthenticatedError: {},
  ProjectionDefinitionMalformed: {},
  QueryDefinitionMalformed: {},
  RequestFailed: {},
  RequestMalformed: {},
  TypeInvalid: {},
  ViewDefinitionMalformed: {}
});

export { errors };
