import { AggregatesService } from '../../../../lib/common/services/AggregatesService';
import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { ConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { createConsumerProgressStore } from '../../../../lib/stores/consumerProgressStore/createConsumerProgressStore';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../lib/stores/lockStore/createLockStore';
import { CustomError } from 'defekt';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { executeFlow } from '../../../../lib/common/domain/executeFlow';
import { getAggregatesService } from '../../../../lib/common/services/getAggregatesService';
import { getCommandService } from '../../../../lib/common/services/getCommandService';
import { getLockService } from '../../../../lib/common/services/getLockService';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { LockService } from '../../../../lib/common/services/LockService';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { LoggerService } from '../../../../lib/common/services/LoggerService';
import { noop } from 'lodash';
import { Repository } from '../../../../lib/common/domain/Repository';
import { uuid } from 'uuidv4';

suite('executeFlow', (): void => {
  let aggregatesService: AggregatesService,
      application: Application,
      consumerProgressStore: ConsumerProgressStore,
      domainEventStore: DomainEventStore,
      lockService: LockService,
      lockStore: LockStore,
      loggedMessages: { level: string; message: string; metadata?: object }[],
      loggerService: LoggerService;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

    application = await loadApplication({ applicationDirectory });

    domainEventStore = await createDomainEventStore({ type: 'InMemory', options: {}});
    lockStore = await createLockStore({ type: 'InMemory', options: {}});
    consumerProgressStore = await createConsumerProgressStore({ type: 'InMemory', options: {}});
    lockService = getLockService({ lockStore });
    loggedMessages = [];
    loggerService = {
      debug (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'debug', message, metadata });
      },
      info (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'info', message, metadata });
      },
      warn (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'warn', message, metadata });
      },
      error (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'error', message, metadata });
      },
      fatal (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'fatal', message, metadata });
      }
    } as LoggerService;

    const repository = new Repository({
      application,
      domainEventStore,
      lockStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' })
    });

    aggregatesService = getAggregatesService({ repository });
  });

  test('throws an error if the flow name does not exist.', async (): Promise<void> => {
    const domainEvent = buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      name: 'executed',
      data: {},
      metadata: { revision: 1 }
    });

    const commandService = getCommandService({ domainEvent, issueCommand: noop });

    await assert.that(async (): Promise<void> => {
      await executeFlow({
        application,
        flowName: 'non-existent',
        domainEvent,
        flowProgressStore: consumerProgressStore,
        services: {
          aggregates: aggregatesService,
          command: commandService,
          infrastructure: application.infrastructure,
          lock: lockService,
          logger: loggerService
        },
        requestReplay: noop
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === 'EFLOWNOTFOUND'
    );
  });

  test('does nothing if the domain event revision is lower than the latest handled revision.', async (): Promise<void> => {
    const domainEvent = buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      name: 'executed',
      data: {},
      metadata: { revision: 5 }
    });

    const commandService = getCommandService({ domainEvent, issueCommand: noop });

    await consumerProgressStore.setProgress({
      consumerId: 'sampleFlow',
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      revision: 8
    });

    const result = await executeFlow({
      application,
      flowName: 'sampleFlow',
      domainEvent,
      flowProgressStore: consumerProgressStore,
      services: {
        aggregates: aggregatesService,
        command: commandService,
        infrastructure: application.infrastructure,
        lock: lockService,
        logger: loggerService
      },
      requestReplay: noop
    });

    assert.that(loggedMessages).is.equalTo([]);
    assert.that(result).is.equalTo('acknowledge');
  });

  test('does nothing if the domain event revision is equal to the latest handled revision.', async (): Promise<void> => {
    const domainEvent = buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      name: 'executed',
      data: {},
      metadata: { revision: 7 }
    });

    const commandService = getCommandService({ domainEvent, issueCommand: noop });

    await consumerProgressStore.setProgress({
      consumerId: 'sampleFlow',
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      revision: 7
    });

    const result = await executeFlow({
      application,
      flowName: 'sampleFlow',
      domainEvent,
      flowProgressStore: consumerProgressStore,
      services: {
        aggregates: aggregatesService,
        command: commandService,
        infrastructure: application.infrastructure,
        lock: lockService,
        logger: loggerService
      },
      requestReplay: noop
    });

    assert.that(loggedMessages).is.equalTo([]);
    assert.that(result).is.equalTo('acknowledge');
  });

  test('executes the relevant handlers.', async (): Promise<void> => {
    const domainEvent = buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      name: 'executed',
      data: {},
      metadata: { revision: 7 }
    });

    const commandService = getCommandService({ domainEvent, issueCommand: noop });

    await consumerProgressStore.setProgress({
      consumerId: 'sampleFlow',
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      revision: 6
    });

    const result = await executeFlow({
      application,
      flowName: 'sampleFlow',
      domainEvent,
      flowProgressStore: consumerProgressStore,
      services: {
        aggregates: aggregatesService,
        command: commandService,
        infrastructure: application.infrastructure,
        lock: lockService,
        logger: loggerService
      },
      requestReplay: noop
    });

    assert.that(await consumerProgressStore.getProgress({
      consumerId: 'sampleFlow',
      aggregateIdentifier: domainEvent.aggregateIdentifier
    })).is.equalTo({ revision: 7, isReplaying: false });
    assert.that(loggedMessages.length).is.equalTo(1);
    assert.that(loggedMessages[0]).is.equalTo({
      level: 'info',
      message: 'Received domain event.',
      metadata: { domainEvent }
    });
    assert.that(result).is.equalTo('acknowledge');
  });

  test('handles errors in flow handlers.', async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'withFailingFlow', language: 'javascript' });

    application = await loadApplication({ applicationDirectory });

    const repository = new Repository({
      application,
      domainEventStore,
      lockStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' })
    });

    aggregatesService = getAggregatesService({ repository });

    const domainEvent = buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      name: 'executed',
      data: {},
      metadata: { revision: 7 }
    });

    const commandService = getCommandService({ domainEvent, issueCommand: noop });

    await consumerProgressStore.setProgress({
      consumerId: 'sampleFlow',
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      revision: 6
    });

    await assert.that(async (): Promise<void> => {
      await executeFlow({
        application,
        flowName: 'sampleFlow',
        domainEvent,
        flowProgressStore: consumerProgressStore,
        services: {
          aggregates: aggregatesService,
          command: commandService,
          infrastructure: application.infrastructure,
          lock: lockService,
          logger: loggerService
        },
        requestReplay: noop
      });
    }).is.throwingAsync(
      (ex): boolean => ex.message === 'An expected error occured.'
    );

    assert.that(await consumerProgressStore.getProgress({
      consumerId: 'sampleFlow',
      aggregateIdentifier: domainEvent.aggregateIdentifier
    })).is.equalTo({ revision: 6, isReplaying: false });
  });

  // TODO: add tests for on-demand and always flow behavior
});
