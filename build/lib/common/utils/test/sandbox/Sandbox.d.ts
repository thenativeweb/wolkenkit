import { AggregateIdentifier } from '../../../elements/AggregateIdentifier';
import { Application } from '../../../application/Application';
import { ConsumerProgressStore } from '../../../../stores/consumerProgressStore/ConsumerProgressStore';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { GetAggregateService } from '../../../services/types/GetAggregateService';
import { GetAggregatesService } from '../../../services/types/GetAggregatesService';
import { GetClientService } from '../../../services/types/GetClientService';
import { GetCommandService } from '../../../services/types/GetCommandService';
import { GetLockService } from '../../../services/types/GetLockService';
import { GetLoggerService } from '../../../services/types/GetLoggerService';
import { GetNotificationService } from '../../../services/types/GetNotificationService';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { Notification } from '../../../elements/Notification';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
import { SandboxForAggregate } from './SandboxForAggregate';
import { SandboxForFlow } from './SandboxForFlow';
import { SandboxForView } from './SandboxForView';
import { SnapshotStrategy } from '../../../domain/SnapshotStrategy';
import { State } from '../../../elements/State';
export interface UninitializedSandbox {
    withApplication: ({ application }: {
        application: Application;
    }) => Sandbox;
}
export interface Sandbox {
    withDomainEventStore: (parameters: {
        domainEventStore: DomainEventStore;
    }) => Sandbox;
    withFlowProgressStore: (parameters: {
        flowProgressStore: ConsumerProgressStore;
    }) => Sandbox;
    withLockStore: (parameters: {
        lockStore: LockStore;
    }) => Sandbox;
    withSnapshotStrategy: (parameters: {
        snapshotStrategy: SnapshotStrategy;
    }) => Sandbox;
    withPublisher: (parameters: {
        publisher: Publisher<Notification>;
    }) => Sandbox;
    withAggregateServiceFactory: (parameters: {
        aggregateServiceFactory: GetAggregateService;
    }) => Sandbox;
    withAggregatesServiceFactory: (parameters: {
        aggregatesServiceFactory: GetAggregatesService;
    }) => Sandbox;
    withClientServiceFactory: (parameters: {
        clientServiceFactory: GetClientService;
    }) => Sandbox;
    withCommandServiceFactory: (parameters: {
        commandServiceFactory: GetCommandService;
    }) => Sandbox;
    withLockServiceFactory: (parameters: {
        lockServiceFactory: GetLockService;
    }) => Sandbox;
    withLoggerServiceFactory: (parameters: {
        loggerServiceFactory: GetLoggerService;
    }) => Sandbox;
    withNotificationServiceFactory: (parameters: {
        notificationServiceFactory: GetNotificationService;
    }) => Sandbox;
    forAggregate: <TState extends State>(parameters: {
        aggregateIdentifier: AggregateIdentifier;
    }) => SandboxForAggregate<TState>;
    forFlow: (parameters: {
        flowName: string;
    }) => SandboxForFlow;
    forView: (parameters: {
        viewName: string;
    }) => SandboxForView;
}
