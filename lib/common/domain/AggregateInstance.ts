import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { Application } from '../application/Application';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { DomainEventStore } from '../../stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { forAwaitOf } from '../utils/forAwaitOf';
import { getAggregateService } from '../services/getAggregateService';
import { GetAggregateService } from '../services/types/GetAggregateService';
import { getAggregatesService } from '../services/getAggregatesService';
import { GetAggregatesService } from '../services/types/GetAggregatesService';
import { getClientService } from '../services/getClientService';
import { GetClientService } from '../services/types/GetClientService';
import { getErrorService } from '../services/getErrorService';
import { getLockService } from '../services/getLockService';
import { GetLockService } from '../services/types/GetLockService';
import { getLoggerService } from '../services/getLoggerService';
import { GetLoggerService } from '../services/types/GetLoggerService';
import { getNotificationService } from '../services/getNotificationService';
import { GetNotificationService } from '../services/types/GetNotificationService';
import { LockStore } from '../../stores/lockStore/LockStore';
import { Notification } from '../elements/Notification';
import { Publisher } from '../../messaging/pubSub/Publisher';
import { Repository } from './Repository';
import { Snapshot } from '../../stores/domainEventStore/Snapshot';
import { SnapshotStrategy } from './SnapshotStrategy';
import { State } from '../elements/State';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { validateCommandWithMetadata } from '../validators/validateCommandWithMetadata';
import { cloneDeep, get } from 'lodash';

class AggregateInstance<TState extends State> {
  public readonly application: Application;

  public readonly contextIdentifier: ContextIdentifier;

  public readonly aggregateIdentifier: AggregateIdentifier;

  public state: TState;

  public revision: number;

  public unstoredDomainEvents: DomainEventWithState<DomainEventData, TState>[];

  public readonly domainEventStore: DomainEventStore;

  public readonly lockStore: LockStore;

  public readonly snapshotStrategy: SnapshotStrategy;

  public readonly publisher: Publisher<Notification>;

  public readonly pubSubChannelForNotifications: string;

  protected serviceFactories: {
    getAggregateService: GetAggregateService;
    getAggregatesService: GetAggregatesService;
    getClientService: GetClientService;
    getLockService: GetLockService;
    getLoggerService: GetLoggerService;
    getNotificationService?: GetNotificationService;
  };

  protected repository: Repository;

  protected constructor ({
    application,
    contextIdentifier,
    aggregateIdentifier,
    initialState,
    domainEventStore,
    lockStore,
    publisher,
    pubSubChannelForNotifications,
    serviceFactories,
    snapshotStrategy,
    repository
  }: {
    application: Application;
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    initialState: TState;
    domainEventStore: DomainEventStore;
    lockStore: LockStore;
    publisher: Publisher<Notification>;
    pubSubChannelForNotifications: string;
    serviceFactories?: {
      getAggregateService?: GetAggregateService;
      getAggregatesService?: GetAggregatesService;
      getClientService?: GetClientService;
      getLockService?: GetLockService;
      getLoggerService?: GetLoggerService;
      getNotificationService?: GetNotificationService;
    };
    snapshotStrategy: SnapshotStrategy;
    repository: Repository;
  }) {
    this.application = application;
    this.contextIdentifier = contextIdentifier;
    this.aggregateIdentifier = aggregateIdentifier;
    this.state = initialState;
    this.revision = 0;
    this.unstoredDomainEvents = [];
    this.domainEventStore = domainEventStore;
    this.lockStore = lockStore;
    this.publisher = publisher;
    this.pubSubChannelForNotifications = pubSubChannelForNotifications;
    this.serviceFactories = {
      getAggregateService: serviceFactories?.getAggregateService ?? getAggregateService,
      getAggregatesService: serviceFactories?.getAggregatesService ?? getAggregatesService,
      getClientService: serviceFactories?.getClientService ?? getClientService,
      getLockService: serviceFactories?.getLockService ?? getLockService,
      getLoggerService: serviceFactories?.getLoggerService ?? getLoggerService,
      getNotificationService: serviceFactories?.getNotificationService ?? getNotificationService
    };
    this.snapshotStrategy = snapshotStrategy;
    this.repository = repository;
  }

  public static async create <TState extends State> ({
    application,
    contextIdentifier,
    aggregateIdentifier,
    domainEventStore,
    lockStore,
    snapshotStrategy,
    publisher,
    pubSubChannelForNotifications,
    serviceFactories,
    repository
  }: {
    application: Application;
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    domainEventStore: DomainEventStore;
    lockStore: LockStore;
    snapshotStrategy: SnapshotStrategy;
    publisher: Publisher<Notification>;
    pubSubChannelForNotifications: string;
    serviceFactories?: {
      getAggregateService?: GetAggregateService;
      getAggregatesService?: GetAggregatesService;
      getClientService?: GetClientService;
      getLockService?: GetLockService;
      getLoggerService?: GetLoggerService;
      getNotificationService?: GetNotificationService;
    };
    repository: Repository;
  }): Promise<AggregateInstance<TState>> {
    if (!(contextIdentifier.name in application.domain)) {
      throw new errors.ContextNotFound();
    }

    const contextDefinition = application.domain[contextIdentifier.name];

    if (!(aggregateIdentifier.name in contextDefinition)) {
      throw new errors.AggregateNotFound();
    }

    const initialState = contextDefinition[aggregateIdentifier.name].getInitialState() as TState;

    const aggregateInstance = new AggregateInstance<TState>({
      application,
      contextIdentifier,
      aggregateIdentifier,
      initialState,
      domainEventStore,
      lockStore,
      publisher,
      pubSubChannelForNotifications,
      serviceFactories,
      snapshotStrategy,
      repository
    });

    const snapshot = await domainEventStore.getSnapshot<TState>({
      aggregateIdentifier
    });

    let fromRevision = 1;

    if (snapshot) {
      aggregateInstance.applySnapshot({ snapshot });
      fromRevision = snapshot.revision + 1;
    }

    const domainEventStream = await domainEventStore.getReplayForAggregate({
      aggregateId: aggregateIdentifier.id,
      fromRevision
    });

    const replayStartRevision = fromRevision - 1,
          replayStartTimestamp = Date.now();

    await forAwaitOf(domainEventStream, async (domainEvent): Promise<void> => {
      aggregateInstance.state = aggregateInstance.applyDomainEvent({
        application,
        domainEvent
      });
      aggregateInstance.revision = domainEvent.metadata.revision;
    });

    const replayDuration = Date.now() - replayStartTimestamp,
          replayedDomainEvents = aggregateInstance.revision - replayStartRevision;

    if (
      replayedDomainEvents > 0 &&
        snapshotStrategy({
          latestSnapshot: snapshot,
          replayDuration,
          replayedDomainEvents
        })) {
      await domainEventStore.storeSnapshot({ snapshot: {
        aggregateIdentifier,
        revision: aggregateInstance.revision,
        state: aggregateInstance.state
      }});
    }

    return aggregateInstance;
  }

  public async storeCurrentAggregateState (): Promise<void> {
    if (this.unstoredDomainEvents.length === 0) {
      return;
    }

    await this.domainEventStore.storeDomainEvents({
      domainEvents: this.unstoredDomainEvents.map(
        (domainEvent): DomainEvent<DomainEventData> => domainEvent.withoutState()
      )
    });
  }

  public async handleCommand ({ command }: {
    command: CommandWithMetadata<CommandData>;
  }): Promise<DomainEventWithState<DomainEventData, TState>[]> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const { application } = this;

    validateCommandWithMetadata({ command, application });
    if (command.contextIdentifier.name !== this.contextIdentifier.name) {
      throw new errors.IdentifierMismatch('Context name does not match.');
    }
    if (command.aggregateIdentifier.name !== this.aggregateIdentifier.name) {
      throw new errors.IdentifierMismatch('Aggregate name does not match.');
    }
    if (command.aggregateIdentifier.id !== this.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Aggregate id does not match.');
    }

    if (await this.domainEventStore.hasDomainEventsWithCausationId({ causationId: command.id })) {
      return [];
    }

    const isAuthorizedServices = {
      aggregate: getAggregateService({ application, command, aggregateInstance: this }),
      aggregates: getAggregatesService({ repository: this.repository }),
      client: getClientService({ clientMetadata: command.metadata.client }),
      error: getErrorService({ errors: [ 'CommandRejected' ]}),
      infrastructure: {
        ask: application.infrastructure.ask
      },
      lock: getLockService({ lockStore: this.lockStore }),
      logger: getLoggerService({
        fileName: `<app>/server/domain/${command.contextIdentifier.name}/${command.aggregateIdentifier.name}/`,
        packageManifest: application.packageManifest
      }),
      notification: getNotificationService({
        application,
        publisher: this.publisher,
        channel: this.pubSubChannelForNotifications
      })
    };
    const handleServices = {
      ...isAuthorizedServices,
      infrastructure: {
        ask: application.infrastructure.ask,
        tell: application.infrastructure.tell
      }
    };

    const commandHandler = application.domain[command.contextIdentifier.name][command.aggregateIdentifier.name].commandHandlers[command.name];

    let domainEvents: DomainEventWithState<DomainEventData, TState>[];

    try {
      const clonedCommand = cloneDeep(command);

      const isAuthorized = await commandHandler.isAuthorized(this.state, clonedCommand, isAuthorizedServices);

      if (!isAuthorized) {
        throw new errors.CommandNotAuthorized();
      }

      await commandHandler.handle(this.state, clonedCommand, handleServices);

      await this.storeCurrentAggregateState();
      domainEvents = this.unstoredDomainEvents;
    } catch (ex) {
      switch (ex.code) {
        case errors.CommandNotAuthorized.code:
        case errors.CommandRejected.code: {
          handleServices.aggregate.publishDomainEvent(`${command.name}Rejected`, {
            reason: ex.message
          });
          break;
        }
        default: {
          handleServices.aggregate.publishDomainEvent(`${command.name}Failed`, {
            reason: ex.message
          });
        }
      }

      domainEvents = [
        this.unstoredDomainEvents[this.unstoredDomainEvents.length - 1]
      ];
    }

    this.unstoredDomainEvents = [];

    for (const domainEvent of domainEvents) {
      this.state = this.applyDomainEvent({
        application,
        domainEvent
      });
      this.revision = domainEvent.metadata.revision;
    }

    return domainEvents;
  }

  public isPristine (): boolean {
    return this.revision === 0;
  }

  public applySnapshot ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }): void {
    if (this.aggregateIdentifier.id !== snapshot.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Failed to apply snapshot. Aggregate id does not match.');
    }

    this.state = snapshot.state;
    this.revision = snapshot.revision;
  }

  public applyDomainEvent <TDomainEventData extends DomainEventData> ({ application, domainEvent }: {
    application: Application;
    domainEvent: DomainEvent<TDomainEventData>;
  }): TState {
    if (domainEvent.contextIdentifier.name !== this.contextIdentifier.name) {
      throw new errors.IdentifierMismatch('Context name does not match.');
    }
    if (domainEvent.aggregateIdentifier.name !== this.aggregateIdentifier.name) {
      throw new errors.IdentifierMismatch('Aggregate name does not match.');
    }
    if (domainEvent.aggregateIdentifier.id !== this.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Aggregate id does not match.');
    }

    const domainEventHandler = get(
      application.domain,
      [ this.contextIdentifier.name, this.aggregateIdentifier.name, 'domainEventHandlers', domainEvent.name ]
    ) as DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure> | undefined;

    if (!domainEventHandler) {
      throw new errors.DomainEventUnknown(`Failed to apply unknown domain event '${domainEvent.name}' in '${this.contextIdentifier.name}.${this.aggregateIdentifier.name}'.`);
    }

    const services = {
      logger: this.serviceFactories.getLoggerService({
        fileName: `<app>/server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/`,
        packageManifest: application.packageManifest
      }),
      infrastructure: {
        ask: application.infrastructure.ask,
        tell: application.infrastructure.tell
      }
    };

    const newStatePartial = domainEventHandler.handle(this.state, domainEvent, services);
    const newState = { ...this.state, ...newStatePartial };

    return newState;
  }
}

export { AggregateInstance };
