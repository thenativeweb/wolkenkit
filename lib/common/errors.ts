import { defekt } from 'defekt';

const errors = defekt({
  AggregateDefinitionMalformed: {},
  AggregateIdentifierMalformed: {},
  AggregateNotFound: {},
  ApplicationMalformed: {},
  ApplicationNotFound: {},
  ClaimsMalformed: {},
  CommandNotAuthorized: {},
  CommandHandlerMalformed: {},
  CommandMalformed: {},
  CommandNotFound: {},
  CommandRejected: {},
  CompilationFailed: {},
  ContentTypeMismatch: {},
  ContextNotFound: {},
  CorsOriginInvalid: {},
  DatabaseTypeInvalid: {},
  DirectoryAlreadyExists: {},
  DirectoryNotFound: {},
  DispatchFailed: {},
  DockerFailed: {},
  DockerBuildFailed: {},
  DockerNotReachable: {},
  DockerPushFailed: {},
  DomainEventAlreadyExists: {},
  DomainEventHandlerMalformed: {},
  DomainEventNotAuthorized: {},
  DomainEventNotFound: {},
  DomainEventMalformed: {},
  DomainEventRejected: {},
  DomainEventUnknown: {},
  ExecutableNotFound: {},
  ExpirationInPast: {},
  FileAlreadyExists: {},
  FileNotFound: {},
  FlowDefinitionMalformed: {},
  FlowDomainEventHandlerMalformed: {},
  FlowIsAlreadyReplaying: {},
  FlowNotFound: {},
  GraphQlError: {},
  HooksDefinitionMalformed: {},
  IdentifierMismatch: {},
  InfrastructureDefinitionMalformed: {},
  InvalidOperation: {},
  ItemAlreadyExists: {},
  ItemIdentifierMalformed: {},
  ItemIdentifierNotFound: {},
  ItemNotFound: {},
  ItemNotLocked: {},
  LockAcquireFailed: {},
  LockExpired: {},
  LockRenewalFailed: {},
  NotAuthenticated: {},
  ParameterInvalid: {},
  ProjectionHandlerMalformed: {},
  PublisherTypeInvalid: {},
  QueryHandlerMalformed: {},
  QueryHandlerNotFound: {},
  QueryOptionsInvalid: {},
  QueryResultInvalid: {},
  ReplayFailed: {},
  RequestFailed: {},
  RequestMalformed: {},
  RevisionAlreadyExists: {},
  RevisionTooLow: {},
  SnapshotMalformed: {},
  SubscriberTypeInvalid: {},
  TokenMismatch: {},
  TypeInvalid: {},
  UnknownError: {},
  ViewDefinitionMalformed: {},
  ViewNotFound: {}
});

export { errors };
