"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockExpired = exports.LockAcquireFailed = exports.ItemNotLocked = exports.ItemNotFound = exports.ItemIdentifierNotFound = exports.ItemIdentifierMalformed = exports.ItemAlreadyExists = exports.InvalidOperation = exports.InfrastructureDefinitionMalformed = exports.IdentifierMismatch = exports.HooksDefinitionMalformed = exports.GraphQlError = exports.FlowNotFound = exports.FlowIsAlreadyReplaying = exports.FlowDomainEventHandlerMalformed = exports.FlowDefinitionMalformed = exports.FileNotFound = exports.FileAlreadyExists = exports.ExpirationInPast = exports.ExecutableNotFound = exports.DomainEventUnknown = exports.DomainEventRejected = exports.DomainEventMalformed = exports.DomainEventNotFound = exports.DomainEventNotAuthorized = exports.DomainEventHandlerMalformed = exports.DomainEventAlreadyExists = exports.DockerPushFailed = exports.DockerNotReachable = exports.DockerBuildFailed = exports.DockerFailed = exports.DispatchFailed = exports.DirectoryNotFound = exports.DirectoryAlreadyExists = exports.DatabaseTypeInvalid = exports.CorsOriginInvalid = exports.ContextNotFound = exports.ContentTypeMismatch = exports.CompilationFailed = exports.CommandRejected = exports.CommandNotFound = exports.CommandMalformed = exports.CommandHandlerMalformed = exports.CommandNotAuthorized = exports.ClaimsMalformed = exports.ApplicationNotFound = exports.ApplicationMalformed = exports.AggregateNotFound = exports.AggregateIdentifierMalformed = exports.AggregateDefinitionMalformed = void 0;
exports.ViewNotFound = exports.ViewDefinitionMalformed = exports.UnknownError = exports.TypeInvalid = exports.TokenMismatch = exports.SubscriberTypeInvalid = exports.StreamClosedUnexpectedly = exports.SnapshotNotFound = exports.SnapshotMalformed = exports.RevisionTooLow = exports.RevisionAlreadyExists = exports.RequestMalformed = exports.RequestFailed = exports.ReplayConfigurationInvalid = exports.ReplayFailed = exports.QueryResultInvalid = exports.QueryOptionsInvalid = exports.QueryNotAuthorized = exports.QueryHandlerTypeMismatch = exports.QueryHandlerNotFound = exports.QueryHandlerMalformed = exports.PublisherTypeInvalid = exports.ProjectionHandlerMalformed = exports.ParameterInvalid = exports.NotificationSubscriberMalformed = exports.NotificationsDefinitionMalformed = exports.NotificationNotFound = exports.NotificationHandlerMalformed = exports.NotFound = exports.NotAuthenticated = exports.LockRenewalFailed = void 0;
const defekt_1 = require("defekt");
class AggregateDefinitionMalformed extends defekt_1.defekt({ code: 'AggregateDefinitionMalformed' }) {
}
exports.AggregateDefinitionMalformed = AggregateDefinitionMalformed;
class AggregateIdentifierMalformed extends defekt_1.defekt({ code: 'AggregateIdentifierMalformed' }) {
}
exports.AggregateIdentifierMalformed = AggregateIdentifierMalformed;
class AggregateNotFound extends defekt_1.defekt({ code: 'AggregateNotFound' }) {
}
exports.AggregateNotFound = AggregateNotFound;
class ApplicationMalformed extends defekt_1.defekt({ code: 'ApplicationMalformed' }) {
}
exports.ApplicationMalformed = ApplicationMalformed;
class ApplicationNotFound extends defekt_1.defekt({ code: 'ApplicationNotFound' }) {
}
exports.ApplicationNotFound = ApplicationNotFound;
class ClaimsMalformed extends defekt_1.defekt({ code: 'ClaimsMalformed' }) {
}
exports.ClaimsMalformed = ClaimsMalformed;
class CommandNotAuthorized extends defekt_1.defekt({ code: 'CommandNotAuthorized' }) {
}
exports.CommandNotAuthorized = CommandNotAuthorized;
class CommandHandlerMalformed extends defekt_1.defekt({ code: 'CommandHandlerMalformed' }) {
}
exports.CommandHandlerMalformed = CommandHandlerMalformed;
class CommandMalformed extends defekt_1.defekt({ code: 'CommandMalformed' }) {
}
exports.CommandMalformed = CommandMalformed;
class CommandNotFound extends defekt_1.defekt({ code: 'CommandNotFound' }) {
}
exports.CommandNotFound = CommandNotFound;
class CommandRejected extends defekt_1.defekt({ code: 'CommandRejected' }) {
}
exports.CommandRejected = CommandRejected;
class CompilationFailed extends defekt_1.defekt({ code: 'CompilationFailed' }) {
}
exports.CompilationFailed = CompilationFailed;
class ContentTypeMismatch extends defekt_1.defekt({ code: 'ContentTypeMismatch' }) {
}
exports.ContentTypeMismatch = ContentTypeMismatch;
class ContextNotFound extends defekt_1.defekt({ code: 'ContextNotFound' }) {
}
exports.ContextNotFound = ContextNotFound;
class CorsOriginInvalid extends defekt_1.defekt({ code: 'CorsOriginInvalid' }) {
}
exports.CorsOriginInvalid = CorsOriginInvalid;
class DatabaseTypeInvalid extends defekt_1.defekt({ code: 'DatabaseTypeInvalid' }) {
}
exports.DatabaseTypeInvalid = DatabaseTypeInvalid;
class DirectoryAlreadyExists extends defekt_1.defekt({ code: 'DirectoryAlreadyExists' }) {
}
exports.DirectoryAlreadyExists = DirectoryAlreadyExists;
class DirectoryNotFound extends defekt_1.defekt({ code: 'DirectoryNotFound' }) {
}
exports.DirectoryNotFound = DirectoryNotFound;
class DispatchFailed extends defekt_1.defekt({ code: 'DispatchFailed' }) {
}
exports.DispatchFailed = DispatchFailed;
class DockerFailed extends defekt_1.defekt({ code: 'DockerFailed' }) {
}
exports.DockerFailed = DockerFailed;
class DockerBuildFailed extends defekt_1.defekt({ code: 'DockerBuildFailed' }) {
}
exports.DockerBuildFailed = DockerBuildFailed;
class DockerNotReachable extends defekt_1.defekt({ code: 'DockerNotReachable' }) {
}
exports.DockerNotReachable = DockerNotReachable;
class DockerPushFailed extends defekt_1.defekt({ code: 'DockerPushFailed' }) {
}
exports.DockerPushFailed = DockerPushFailed;
class DomainEventAlreadyExists extends defekt_1.defekt({ code: 'DomainEventAlreadyExists' }) {
}
exports.DomainEventAlreadyExists = DomainEventAlreadyExists;
class DomainEventHandlerMalformed extends defekt_1.defekt({ code: 'DomainEventHandlerMalformed' }) {
}
exports.DomainEventHandlerMalformed = DomainEventHandlerMalformed;
class DomainEventNotAuthorized extends defekt_1.defekt({ code: 'DomainEventNotAuthorized' }) {
}
exports.DomainEventNotAuthorized = DomainEventNotAuthorized;
class DomainEventNotFound extends defekt_1.defekt({ code: 'DomainEventNotFound' }) {
}
exports.DomainEventNotFound = DomainEventNotFound;
class DomainEventMalformed extends defekt_1.defekt({ code: 'DomainEventMalformed' }) {
}
exports.DomainEventMalformed = DomainEventMalformed;
class DomainEventRejected extends defekt_1.defekt({ code: 'DomainEventRejected' }) {
}
exports.DomainEventRejected = DomainEventRejected;
class DomainEventUnknown extends defekt_1.defekt({ code: 'DomainEventUnknown' }) {
}
exports.DomainEventUnknown = DomainEventUnknown;
class ExecutableNotFound extends defekt_1.defekt({ code: 'ExecutableNotFound' }) {
}
exports.ExecutableNotFound = ExecutableNotFound;
class ExpirationInPast extends defekt_1.defekt({ code: 'ExpirationInPast' }) {
}
exports.ExpirationInPast = ExpirationInPast;
class FileAlreadyExists extends defekt_1.defekt({ code: 'FileAlreadyExists' }) {
}
exports.FileAlreadyExists = FileAlreadyExists;
class FileNotFound extends defekt_1.defekt({ code: 'FileNotFound' }) {
}
exports.FileNotFound = FileNotFound;
class FlowDefinitionMalformed extends defekt_1.defekt({ code: 'FlowDefinitionMalformed' }) {
}
exports.FlowDefinitionMalformed = FlowDefinitionMalformed;
class FlowDomainEventHandlerMalformed extends defekt_1.defekt({ code: 'FlowDomainEventHandlerMalformed' }) {
}
exports.FlowDomainEventHandlerMalformed = FlowDomainEventHandlerMalformed;
class FlowIsAlreadyReplaying extends defekt_1.defekt({ code: 'FlowIsAlreadyReplaying' }) {
}
exports.FlowIsAlreadyReplaying = FlowIsAlreadyReplaying;
class FlowNotFound extends defekt_1.defekt({ code: 'FlowNotFound' }) {
}
exports.FlowNotFound = FlowNotFound;
class GraphQlError extends defekt_1.defekt({ code: 'GraphQlError' }) {
}
exports.GraphQlError = GraphQlError;
class HooksDefinitionMalformed extends defekt_1.defekt({ code: 'HooksDefinitionMalformed' }) {
}
exports.HooksDefinitionMalformed = HooksDefinitionMalformed;
class IdentifierMismatch extends defekt_1.defekt({ code: 'IdentifierMismatch' }) {
}
exports.IdentifierMismatch = IdentifierMismatch;
class InfrastructureDefinitionMalformed extends defekt_1.defekt({ code: 'InfrastructureDefinitionMalformed' }) {
}
exports.InfrastructureDefinitionMalformed = InfrastructureDefinitionMalformed;
class InvalidOperation extends defekt_1.defekt({ code: 'InvalidOperation' }) {
}
exports.InvalidOperation = InvalidOperation;
class ItemAlreadyExists extends defekt_1.defekt({ code: 'ItemAlreadyExists' }) {
}
exports.ItemAlreadyExists = ItemAlreadyExists;
class ItemIdentifierMalformed extends defekt_1.defekt({ code: 'ItemIdentifierMalformed' }) {
}
exports.ItemIdentifierMalformed = ItemIdentifierMalformed;
class ItemIdentifierNotFound extends defekt_1.defekt({ code: 'ItemIdentifierNotFound' }) {
}
exports.ItemIdentifierNotFound = ItemIdentifierNotFound;
class ItemNotFound extends defekt_1.defekt({ code: 'ItemNotFound' }) {
}
exports.ItemNotFound = ItemNotFound;
class ItemNotLocked extends defekt_1.defekt({ code: 'ItemNotLocked' }) {
}
exports.ItemNotLocked = ItemNotLocked;
class LockAcquireFailed extends defekt_1.defekt({ code: 'LockAcquireFailed' }) {
}
exports.LockAcquireFailed = LockAcquireFailed;
class LockExpired extends defekt_1.defekt({ code: 'LockExpired' }) {
}
exports.LockExpired = LockExpired;
class LockRenewalFailed extends defekt_1.defekt({ code: 'LockRenewalFailed' }) {
}
exports.LockRenewalFailed = LockRenewalFailed;
class NotAuthenticated extends defekt_1.defekt({ code: 'NotAuthenticated' }) {
}
exports.NotAuthenticated = NotAuthenticated;
class NotFound extends defekt_1.defekt({ code: 'NotFound' }) {
}
exports.NotFound = NotFound;
class NotificationHandlerMalformed extends defekt_1.defekt({ code: 'NotificationHandlerMalformed' }) {
}
exports.NotificationHandlerMalformed = NotificationHandlerMalformed;
class NotificationNotFound extends defekt_1.defekt({ code: 'NotificationNotFound' }) {
}
exports.NotificationNotFound = NotificationNotFound;
class NotificationsDefinitionMalformed extends defekt_1.defekt({ code: 'NotificationsDefinitionMalformed' }) {
}
exports.NotificationsDefinitionMalformed = NotificationsDefinitionMalformed;
class NotificationSubscriberMalformed extends defekt_1.defekt({ code: 'NotificationSubscriberMalformed' }) {
}
exports.NotificationSubscriberMalformed = NotificationSubscriberMalformed;
class ParameterInvalid extends defekt_1.defekt({ code: 'ParameterInvalid' }) {
}
exports.ParameterInvalid = ParameterInvalid;
class ProjectionHandlerMalformed extends defekt_1.defekt({ code: 'ProjectionHandlerMalformed' }) {
}
exports.ProjectionHandlerMalformed = ProjectionHandlerMalformed;
class PublisherTypeInvalid extends defekt_1.defekt({ code: 'PublisherTypeInvalid' }) {
}
exports.PublisherTypeInvalid = PublisherTypeInvalid;
class QueryHandlerMalformed extends defekt_1.defekt({ code: 'QueryHandlerMalformed' }) {
}
exports.QueryHandlerMalformed = QueryHandlerMalformed;
class QueryHandlerNotFound extends defekt_1.defekt({ code: 'QueryHandlerNotFound' }) {
}
exports.QueryHandlerNotFound = QueryHandlerNotFound;
class QueryHandlerTypeMismatch extends defekt_1.defekt({ code: 'QueryHandlerTypeMismatch' }) {
}
exports.QueryHandlerTypeMismatch = QueryHandlerTypeMismatch;
class QueryNotAuthorized extends defekt_1.defekt({ code: 'QueryNotAuthorized' }) {
}
exports.QueryNotAuthorized = QueryNotAuthorized;
class QueryOptionsInvalid extends defekt_1.defekt({ code: 'QueryOptionsInvalid' }) {
}
exports.QueryOptionsInvalid = QueryOptionsInvalid;
class QueryResultInvalid extends defekt_1.defekt({ code: 'QueryResultInvalid' }) {
}
exports.QueryResultInvalid = QueryResultInvalid;
class ReplayFailed extends defekt_1.defekt({ code: 'ReplayFailed' }) {
}
exports.ReplayFailed = ReplayFailed;
class ReplayConfigurationInvalid extends defekt_1.defekt({ code: 'ReplayConfigurationInvalid' }) {
}
exports.ReplayConfigurationInvalid = ReplayConfigurationInvalid;
class RequestFailed extends defekt_1.defekt({ code: 'RequestFailed' }) {
}
exports.RequestFailed = RequestFailed;
class RequestMalformed extends defekt_1.defekt({ code: 'RequestMalformed' }) {
}
exports.RequestMalformed = RequestMalformed;
class RevisionAlreadyExists extends defekt_1.defekt({ code: 'RevisionAlreadyExists' }) {
}
exports.RevisionAlreadyExists = RevisionAlreadyExists;
class RevisionTooLow extends defekt_1.defekt({ code: 'RevisionTooLow' }) {
}
exports.RevisionTooLow = RevisionTooLow;
class SnapshotMalformed extends defekt_1.defekt({ code: 'SnapshotMalformed' }) {
}
exports.SnapshotMalformed = SnapshotMalformed;
class SnapshotNotFound extends defekt_1.defekt({ code: 'SnapshotNotFound' }) {
}
exports.SnapshotNotFound = SnapshotNotFound;
class StreamClosedUnexpectedly extends defekt_1.defekt({ code: 'StreamClosedUnexpectedly' }) {
}
exports.StreamClosedUnexpectedly = StreamClosedUnexpectedly;
class SubscriberTypeInvalid extends defekt_1.defekt({ code: 'SubscriberTypeInvalid' }) {
}
exports.SubscriberTypeInvalid = SubscriberTypeInvalid;
class TokenMismatch extends defekt_1.defekt({ code: 'TokenMismatch' }) {
}
exports.TokenMismatch = TokenMismatch;
class TypeInvalid extends defekt_1.defekt({ code: 'TypeInvalid' }) {
}
exports.TypeInvalid = TypeInvalid;
class UnknownError extends defekt_1.defekt({ code: 'UnknownError' }) {
}
exports.UnknownError = UnknownError;
class ViewDefinitionMalformed extends defekt_1.defekt({ code: 'ViewDefinitionMalformed' }) {
}
exports.ViewDefinitionMalformed = ViewDefinitionMalformed;
class ViewNotFound extends defekt_1.defekt({ code: 'ViewNotFound' }) {
}
exports.ViewNotFound = ViewNotFound;
//# sourceMappingURL=errors.js.map