import defekt from 'defekt';

const errors = defekt({
  AggregateDefinitionMalformed: {},
  ApplicationNotFound: {},
  CommandMalformed: {},
  CommandDefinitionMalformed: {},
  CompilationFailed: {},
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
  TypeInvalid: {},
  ViewDefinitionMalformed: {}
});

export default errors;
