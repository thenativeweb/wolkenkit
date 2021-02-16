import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { Application } from '../application/Application';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { DomainEventStore } from '../../stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
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

  public static async create <TCreateState extends State> ({
    application,
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
  }): Promise<AggregateInstance<TCreateState>> {
    if (!(aggregateIdentifier.context.name in application.domain)) {
      throw new errors.ContextNotFound();
    }

    const contextDefinition = application.domain[aggregateIdentifier.context.name];

    if (!(aggregateIdentifier.aggregate.name in contextDefinition)) {
      throw new errors.AggregateNotFound();
    }

    const initialState = contextDefinition[aggregateIdentifier.aggregate.name].getInitialState() as TCreateState;

    const aggregateInstance = new AggregateInstance<TCreateState>({
      application,
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

    const snapshot = await domainEventStore.getSnapshot<TCreateState>({
      aggregateIdentifier
    });

    let fromRevision = 1;

    if (snapshot) {
      aggregateInstance.applySnapshot({ snapshot });
      fromRevision = snapshot.revision + 1;
    }

    const domainEventStream = await domainEventStore.getReplayForAggregate({
      aggregateId: aggregateIdentifier.aggregate.id,
      fromRevision
    });

    const replayStartRevision = fromRevision - 1,
          replayStartTimestamp = Date.now();

    for await (const domainEvent of domainEventStream) {
      aggregateInstance.state = aggregateInstance.applyDomainEvent({
        application,
        domainEvent
      });
      aggregateInstance.revision = domainEvent.metadata.revision;
    }

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
    const {
      aggregateIdentifier,
      application,
      domainEventStore,
      lockStore,
      publisher,
      pubSubChannelForNotifications,
      repository,
      state,
      unstoredDomainEvents
    } = this;

    validateCommandWithMetadata({ command, application });
    if (command.aggregateIdentifier.context.name !== aggregateIdentifier.context.name) {
      throw new errors.IdentifierMismatch('Context name does not match.');
    }
    if (command.aggregateIdentifier.aggregate.name !== aggregateIdentifier.aggregate.name) {
      throw new errors.IdentifierMismatch('Aggregate name does not match.');
    }
    if (command.aggregateIdentifier.aggregate.id !== aggregateIdentifier.aggregate.id) {
      throw new errors.IdentifierMismatch('Aggregate id does not match.');
    }

    if (await domainEventStore.hasDomainEventsWithCausationId({ causationId: command.id })) {
      return [];
    }

    const isAuthorizedServices = {
      aggregate: getAggregateService({ application, command, aggregateInstance: this }),
      aggregates: getAggregatesService({ repository }),
      client: getClientService({ clientMetadata: command.metadata.client }),
      error: getErrorService({ errors: [ 'CommandRejected' ]}),
      infrastructure: {
        ask: application.infrastructure.ask
      },
      lock: getLockService({ lockStore }),
      logger: getLoggerService({
        fileName: `<app>/server/domain/${command.aggregateIdentifier.context.name}/${command.aggregateIdentifier.aggregate.name}/`,
        packageManifest: application.packageManifest
      }),
      notification: getNotificationService({
        application,
        publisher,
        channel: pubSubChannelForNotifications
      })
    };
    const handleServices = {
      ...isAuthorizedServices,
      infrastructure: {
        ask: application.infrastructure.ask,
        tell: application.infrastructure.tell
      }
    };

    const commandHandler = application.domain[command.aggregateIdentifier.context.name][command.aggregateIdentifier.aggregate.name].commandHandlers[command.name];

    let domainEvents: DomainEventWithState<DomainEventData, TState>[];

    try {
      const clonedCommand = cloneDeep(command);

      const isAuthorized = await commandHandler.isAuthorized(state, clonedCommand, isAuthorizedServices);

      if (!isAuthorized) {
        throw new errors.CommandNotAuthorized();
      }

      await commandHandler.handle(state, clonedCommand, handleServices);

      await this.storeCurrentAggregateState();
      domainEvents = unstoredDomainEvents;
    } catch (ex: unknown) {
      switch ((ex as CustomError).code) {
        case errors.CommandNotAuthorized.code:
        case errors.CommandRejected.code: {
          handleServices.aggregate.publishDomainEvent(`${command.name}Rejected`, {
            reason: (ex as Error).message
          });
          break;
        }
        default: {
          handleServices.aggregate.publishDomainEvent(`${command.name}Failed`, {
            reason: (ex as Error).message
          });
        }
      }

      domainEvents = [
        unstoredDomainEvents[unstoredDomainEvents.length - 1]
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
    if (this.aggregateIdentifier.aggregate.id !== snapshot.aggregateIdentifier.aggregate.id) {
      throw new errors.IdentifierMismatch('Failed to apply snapshot. Aggregate id does not match.');
    }

    this.state = snapshot.state;
    this.revision = snapshot.revision;
  }

  public applyDomainEvent <TDomainEventData extends DomainEventData> ({ application, domainEvent }: {
    application: Application;
    domainEvent: DomainEvent<TDomainEventData>;
  }): TState {
    if (domainEvent.aggregateIdentifier.context.name !== this.aggregateIdentifier.context.name) {
      throw new errors.IdentifierMismatch('Context name does not match.');
    }
    if (domainEvent.aggregateIdentifier.aggregate.name !== this.aggregateIdentifier.aggregate.name) {
      throw new errors.IdentifierMismatch('Aggregate name does not match.');
    }
    if (domainEvent.aggregateIdentifier.aggregate.id !== this.aggregateIdentifier.aggregate.id) {
      throw new errors.IdentifierMismatch('Aggregate id does not match.');
    }

    const domainEventHandler = get(
      application.domain,
      [ this.aggregateIdentifier.context.name, this.aggregateIdentifier.aggregate.name, 'domainEventHandlers', domainEvent.name ]
    ) as DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure> | undefined;

    if (!domainEventHandler) {
      throw new errors.DomainEventUnknown(`Failed to apply unknown domain event '${domainEvent.name}' in '${this.aggregateIdentifier.context.name}.${this.aggregateIdentifier.aggregate.name}'.`);
    }

    const services = {
      logger: this.serviceFactories.getLoggerService({
        fileName: `<app>/server/domain/${domainEvent.aggregateIdentifier.context.name}/${domainEvent.aggregateIdentifier.aggregate.name}/`,
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
