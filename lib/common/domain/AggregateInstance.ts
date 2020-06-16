import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { ContextIdentifier } from '../elements/ContextIdentifier';
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
import { LockStore } from '../../stores/lockStore/LockStore';
import { Repository } from './Repository';
import { Snapshot } from '../../stores/domainEventStore/Snapshot';
import { SnapshotStrategy } from './SnapshotStrategy';
import { State } from '../elements/State';
import { validateCommandWithMetadata } from '../validators/validateCommandWithMetadata';
import { cloneDeep, get } from 'lodash';

class AggregateInstance<TState extends State> {
  public readonly applicationDefinition: ApplicationDefinition;

  public readonly contextIdentifier: ContextIdentifier;

  public readonly aggregateIdentifier: AggregateIdentifier;

  public state: TState;

  public revision: number;

  public unstoredDomainEvents: DomainEventWithState<DomainEventData, TState>[];

  public readonly domainEventStore: DomainEventStore;

  public readonly lockStore: LockStore;

  public readonly snapshotStrategy: SnapshotStrategy;

  protected serviceFactories: {
    getAggregateService: GetAggregateService;
    getAggregatesService: GetAggregatesService;
    getClientService: GetClientService;
    getLockService: GetLockService;
    getLoggerService: GetLoggerService;
  };

  protected repository: Repository;

  protected constructor ({
    applicationDefinition,
    contextIdentifier,
    aggregateIdentifier,
    initialState,
    domainEventStore,
    lockStore,
    serviceFactories,
    snapshotStrategy,
    repository
  }: {
    applicationDefinition: ApplicationDefinition;
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    initialState: TState;
    domainEventStore: DomainEventStore;
    lockStore: LockStore;
    serviceFactories?: {
      getAggregateService?: GetAggregateService;
      getAggregatesService?: GetAggregatesService;
      getClientService?: GetClientService;
      getLockService?: GetLockService;
      getLoggerService?: GetLoggerService;
    };
    snapshotStrategy: SnapshotStrategy;
    repository: Repository;
  }) {
    this.applicationDefinition = applicationDefinition;
    this.contextIdentifier = contextIdentifier;
    this.aggregateIdentifier = aggregateIdentifier;
    this.state = initialState;
    this.revision = 0;
    this.unstoredDomainEvents = [];
    this.domainEventStore = domainEventStore;
    this.lockStore = lockStore;
    this.serviceFactories = {
      getAggregateService: serviceFactories?.getAggregateService ?? getAggregateService,
      getAggregatesService: serviceFactories?.getAggregatesService ?? getAggregatesService,
      getClientService: serviceFactories?.getClientService ?? getClientService,
      getLockService: serviceFactories?.getLockService ?? getLockService,
      getLoggerService: serviceFactories?.getLoggerService ?? getLoggerService
    };
    this.snapshotStrategy = snapshotStrategy;
    this.repository = repository;
  }

  public static async create <TState extends State> ({
    applicationDefinition,
    contextIdentifier,
    aggregateIdentifier,
    domainEventStore,
    lockStore,
    snapshotStrategy,
    serviceFactories,
    repository
  }: {
    applicationDefinition: ApplicationDefinition;
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    domainEventStore: DomainEventStore;
    lockStore: LockStore;
    snapshotStrategy: SnapshotStrategy;
    serviceFactories?: {
      getAggregateService?: GetAggregateService;
      getAggregatesService?: GetAggregatesService;
      getClientService?: GetClientService;
      getLockService?: GetLockService;
      getLoggerService?: GetLoggerService;
    };
    repository: Repository;
  }): Promise<AggregateInstance<TState>> {
    if (!(contextIdentifier.name in applicationDefinition.domain)) {
      throw new errors.ContextNotFound();
    }

    const contextDefinition = applicationDefinition.domain[contextIdentifier.name];

    if (!(aggregateIdentifier.name in contextDefinition)) {
      throw new errors.AggregateNotFound();
    }

    const initialState = contextDefinition[aggregateIdentifier.name].getInitialState() as TState;

    const aggregateInstance = new AggregateInstance<TState>({
      applicationDefinition,
      contextIdentifier,
      aggregateIdentifier,
      initialState,
      domainEventStore,
      lockStore,
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

    for await (const domainEvent of domainEventStream) {
      aggregateInstance.state = aggregateInstance.applyDomainEvent({
        applicationDefinition,
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

  public async handleCommand ({
    command
  }: {
    command: CommandWithMetadata<CommandData>;
  }): Promise<DomainEventWithState<DomainEventData, TState>[]> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const { applicationDefinition } = this;

    validateCommandWithMetadata({ command, applicationDefinition });
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

    const services = {
      aggregate: getAggregateService({ applicationDefinition, command, aggregateInstance: this }),
      aggregates: getAggregatesService({ repository: this.repository }),
      client: getClientService({ clientMetadata: command.metadata.client }),
      error: getErrorService(),
      lock: getLockService({ lockStore: this.lockStore }),
      logger: getLoggerService({
        fileName: `<app>/server/domain/${command.contextIdentifier.name}/${command.aggregateIdentifier.name}/`,
        packageManifest: applicationDefinition.packageManifest
      })
    };

    const commandHandler = applicationDefinition.domain[command.contextIdentifier.name][command.aggregateIdentifier.name].commandHandlers[command.name];

    let domainEvents: DomainEventWithState<DomainEventData, TState>[];

    try {
      const clonedCommand = cloneDeep(command);

      const isAuthorized = await commandHandler.isAuthorized(this.state, clonedCommand, services);

      if (!isAuthorized) {
        throw new errors.CommandNotAuthorized();
      }

      await commandHandler.handle(this.state, clonedCommand, services);

      await this.storeCurrentAggregateState();
      domainEvents = this.unstoredDomainEvents;
    } catch (ex) {
      switch (ex.code) {
        case 'ECOMMANDNOTAUTHORIZED':
        case 'ECOMMANDREJECTED': {
          services.aggregate.publishDomainEvent(`${command.name}Rejected`, {
            reason: ex.message
          });
          break;
        }
        default: {
          services.aggregate.publishDomainEvent(`${command.name}Failed`, {
            reason: ex.message
          });
        }
      }

      domainEvents = [
        this.unstoredDomainEvents[this.unstoredDomainEvents.length - 1]
      ];
    }

    this.unstoredDomainEvents = [];

    return domainEvents;
  }

  public isPristine (): boolean {
    return this.revision > 0;
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

  public applyDomainEvent <TDomainEventData extends DomainEventData> ({ applicationDefinition, domainEvent }: {
    applicationDefinition: ApplicationDefinition;
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

    const domainEventHandler = get(applicationDefinition.domain, [ this.contextIdentifier.name, this.aggregateIdentifier.name, 'domainEventHandlers', domainEvent.name ]) as DomainEventHandler<State, DomainEventData> | undefined;

    if (!domainEventHandler) {
      throw new errors.DomainEventUnknown(`Failed to apply unknown domain event '${domainEvent.name}' in '${this.contextIdentifier.name}.${this.aggregateIdentifier.name}'.`);
    }

    const services = {
      logger: this.serviceFactories.getLoggerService({
        fileName: `<app>/server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/`,
        packageManifest: applicationDefinition.packageManifest
      })
    };

    const newStatePartial = domainEventHandler.handle(this.state, domainEvent, services);

    return {
      ...this.state,
      ...newStatePartial
    };
  }
}

export { AggregateInstance };
