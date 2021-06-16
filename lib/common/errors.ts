import { defekt } from 'defekt';

class AggregateDefinitionMalformed extends defekt({ code: 'AggregateDefinitionMalformed' }) {}
class AggregateIdentifierMalformed extends defekt({ code: 'AggregateIdentifierMalformed' }) {}
class AggregateNotFound extends defekt({ code: 'AggregateNotFound' }) {}
class ApplicationMalformed extends defekt({ code: 'ApplicationMalformed' }) {}
class ApplicationNotFound extends defekt({ code: 'ApplicationNotFound' }) {}
class ClaimsMalformed extends defekt({ code: 'ClaimsMalformed' }) {}
class CommandNotAuthorized extends defekt({ code: 'CommandNotAuthorized' }) {}
class CommandHandlerMalformed extends defekt({ code: 'CommandHandlerMalformed' }) {}
class CommandMalformed extends defekt({ code: 'CommandMalformed' }) {}
class CommandNotFound extends defekt({ code: 'CommandNotFound' }) {}
class CommandRejected extends defekt({ code: 'CommandRejected' }) {}
class CompilationFailed extends defekt({ code: 'CompilationFailed' }) {}
class ContentTypeMismatch extends defekt({ code: 'ContentTypeMismatch' }) {}
class ContextNotFound extends defekt({ code: 'ContextNotFound' }) {}
class CorsOriginInvalid extends defekt({ code: 'CorsOriginInvalid' }) {}
class DatabaseTypeInvalid extends defekt({ code: 'DatabaseTypeInvalid' }) {}
class DirectoryAlreadyExists extends defekt({ code: 'DirectoryAlreadyExists' }) {}
class DirectoryNotFound extends defekt({ code: 'DirectoryNotFound' }) {}
class DispatchFailed extends defekt({ code: 'DispatchFailed' }) {}
class DockerFailed extends defekt({ code: 'DockerFailed' }) {}
class DockerBuildFailed extends defekt({ code: 'DockerBuildFailed' }) {}
class DockerNotReachable extends defekt({ code: 'DockerNotReachable' }) {}
class DockerPushFailed extends defekt({ code: 'DockerPushFailed' }) {}
class DomainEventAlreadyExists extends defekt({ code: 'DomainEventAlreadyExists' }) {}
class DomainEventHandlerMalformed extends defekt({ code: 'DomainEventHandlerMalformed' }) {}
class DomainEventNotAuthorized extends defekt({ code: 'DomainEventNotAuthorized' }) {}
class DomainEventNotFound extends defekt({ code: 'DomainEventNotFound' }) {}
class DomainEventMalformed extends defekt({ code: 'DomainEventMalformed' }) {}
class DomainEventRejected extends defekt({ code: 'DomainEventRejected' }) {}
class DomainEventUnknown extends defekt({ code: 'DomainEventUnknown' }) {}
class ExecutableNotFound extends defekt({ code: 'ExecutableNotFound' }) {}
class ExpirationInPast extends defekt({ code: 'ExpirationInPast' }) {}
class FileAlreadyExists extends defekt({ code: 'FileAlreadyExists' }) {}
class FileNotFound extends defekt({ code: 'FileNotFound' }) {}
class FlowDefinitionMalformed extends defekt({ code: 'FlowDefinitionMalformed' }) {}
class FlowDomainEventHandlerMalformed extends defekt({ code: 'FlowDomainEventHandlerMalformed' }) {}
class FlowIsAlreadyReplaying extends defekt({ code: 'FlowIsAlreadyReplaying' }) {}
class FlowNotFound extends defekt({ code: 'FlowNotFound' }) {}
class GraphQlError extends defekt({ code: 'GraphQlError' }) {}
class HooksDefinitionMalformed extends defekt({ code: 'HooksDefinitionMalformed' }) {}
class IdentifierMismatch extends defekt({ code: 'IdentifierMismatch' }) {}
class InfrastructureDefinitionMalformed extends defekt({ code: 'InfrastructureDefinitionMalformed' }) {}
class InvalidOperation extends defekt({ code: 'InvalidOperation' }) {}
class ItemAlreadyExists extends defekt({ code: 'ItemAlreadyExists' }) {}
class ItemIdentifierMalformed extends defekt({ code: 'ItemIdentifierMalformed' }) {}
class ItemIdentifierNotFound extends defekt({ code: 'ItemIdentifierNotFound' }) {}
class ItemNotFound extends defekt({ code: 'ItemNotFound' }) {}
class ItemNotLocked extends defekt({ code: 'ItemNotLocked' }) {}
class LockAcquireFailed extends defekt({ code: 'LockAcquireFailed' }) {}
class LockExpired extends defekt({ code: 'LockExpired' }) {}
class LockRenewalFailed extends defekt({ code: 'LockRenewalFailed' }) {}
class NotAuthenticated extends defekt({ code: 'NotAuthenticated' }) {}
class NotFound extends defekt({ code: 'NotFound' }) {}
class NotificationHandlerMalformed extends defekt({ code: 'NotificationHandlerMalformed' }) {}
class NotificationNotFound extends defekt({ code: 'NotificationNotFound' }) {}
class NotificationsDefinitionMalformed extends defekt({ code: 'NotificationsDefinitionMalformed' }) {}
class NotificationSubscriberMalformed extends defekt({ code: 'NotificationSubscriberMalformed' }) {}
class ParameterInvalid extends defekt({ code: 'ParameterInvalid' }) {}
class ProjectionHandlerMalformed extends defekt({ code: 'ProjectionHandlerMalformed' }) {}
class PublisherTypeInvalid extends defekt({ code: 'PublisherTypeInvalid' }) {}
class QueryHandlerMalformed extends defekt({ code: 'QueryHandlerMalformed' }) {}
class QueryHandlerNotFound extends defekt({ code: 'QueryHandlerNotFound' }) {}
class QueryHandlerTypeMismatch extends defekt({ code: 'QueryHandlerTypeMismatch' }) {}
class QueryNotAuthorized extends defekt({ code: 'QueryNotAuthorized' }) {}
class QueryOptionsInvalid extends defekt({ code: 'QueryOptionsInvalid' }) {}
class QueryResultInvalid extends defekt({ code: 'QueryResultInvalid' }) {}
class ReplayFailed extends defekt({ code: 'ReplayFailed' }) {}
class ReplayConfigurationInvalid extends defekt({ code: 'ReplayConfigurationInvalid' }) {}
class RequestFailed extends defekt({ code: 'RequestFailed' }) {}
class RequestMalformed extends defekt({ code: 'RequestMalformed' }) {}
class RevisionAlreadyExists extends defekt({ code: 'RevisionAlreadyExists' }) {}
class RevisionTooLow extends defekt({ code: 'RevisionTooLow' }) {}
class SnapshotMalformed extends defekt({ code: 'SnapshotMalformed' }) {}
class SnapshotNotFound extends defekt({ code: 'SnapshotNotFound' }) {}
class StreamClosedUnexpectedly extends defekt({ code: 'StreamClosedUnexpectedly' }) {}
class SubscriberTypeInvalid extends defekt({ code: 'SubscriberTypeInvalid' }) {}
class TokenMismatch extends defekt({ code: 'TokenMismatch' }) {}
class TypeInvalid extends defekt({ code: 'TypeInvalid' }) {}
class UnknownError extends defekt({ code: 'UnknownError' }) {}
class ViewDefinitionMalformed extends defekt({ code: 'ViewDefinitionMalformed' }) {}
class ViewNotFound extends defekt({ code: 'ViewNotFound' }) {}

export {
  AggregateDefinitionMalformed,
  AggregateIdentifierMalformed,
  AggregateNotFound,
  ApplicationMalformed,
  ApplicationNotFound,
  ClaimsMalformed,
  CommandNotAuthorized,
  CommandHandlerMalformed,
  CommandMalformed,
  CommandNotFound,
  CommandRejected,
  CompilationFailed,
  ContentTypeMismatch,
  ContextNotFound,
  CorsOriginInvalid,
  DatabaseTypeInvalid,
  DirectoryAlreadyExists,
  DirectoryNotFound,
  DispatchFailed,
  DockerFailed,
  DockerBuildFailed,
  DockerNotReachable,
  DockerPushFailed,
  DomainEventAlreadyExists,
  DomainEventHandlerMalformed,
  DomainEventNotAuthorized,
  DomainEventNotFound,
  DomainEventMalformed,
  DomainEventRejected,
  DomainEventUnknown,
  ExecutableNotFound,
  ExpirationInPast,
  FileAlreadyExists,
  FileNotFound,
  FlowDefinitionMalformed,
  FlowDomainEventHandlerMalformed,
  FlowIsAlreadyReplaying,
  FlowNotFound,
  GraphQlError,
  HooksDefinitionMalformed,
  IdentifierMismatch,
  InfrastructureDefinitionMalformed,
  InvalidOperation,
  ItemAlreadyExists,
  ItemIdentifierMalformed,
  ItemIdentifierNotFound,
  ItemNotFound,
  ItemNotLocked,
  LockAcquireFailed,
  LockExpired,
  LockRenewalFailed,
  NotAuthenticated,
  NotFound,
  NotificationHandlerMalformed,
  NotificationNotFound,
  NotificationsDefinitionMalformed,
  NotificationSubscriberMalformed,
  ParameterInvalid,
  ProjectionHandlerMalformed,
  PublisherTypeInvalid,
  QueryHandlerMalformed,
  QueryHandlerNotFound,
  QueryHandlerTypeMismatch,
  QueryNotAuthorized,
  QueryOptionsInvalid,
  QueryResultInvalid,
  ReplayFailed,
  ReplayConfigurationInvalid,
  RequestFailed,
  RequestMalformed,
  RevisionAlreadyExists,
  RevisionTooLow,
  SnapshotMalformed,
  SnapshotNotFound,
  StreamClosedUnexpectedly,
  SubscriberTypeInvalid,
  TokenMismatch,
  TypeInvalid,
  UnknownError,
  ViewDefinitionMalformed,
  ViewNotFound
};
