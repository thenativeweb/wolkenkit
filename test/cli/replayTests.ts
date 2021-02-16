import { AggregateIdentifier } from '../../lib/common/elements/AggregateIdentifier';
import { Application } from '../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../lib/common/utils/test/buildDomainEvent';
import { connectionOptions } from '../shared/containers/connectionOptions';
import { ConsumerProgressStore } from '../../lib/stores/consumerProgressStore/ConsumerProgressStore';
import { ConsumerProgressStoreOptions } from '../../lib/stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { createConsumerProgressStore } from '../../lib/stores/consumerProgressStore/createConsumerProgressStore';
import { createDomainEventStore } from '../../lib/stores/domainEventStore/createDomainEventStore';
import { DomainEventStore } from '../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventStoreOptions } from '../../lib/stores/domainEventStore/DomainEventStoreOptions';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../lib/apis/performReplay/http';
import { getShortId } from '../shared/getShortId';
import { isolated } from 'isolated';
import { loadApplication } from '../../lib/common/application/loadApplication';
import { oneLine } from 'common-tags';
import path from 'path';
import { runAsServer } from '../shared/http/runAsServer';
import shell from 'shelljs';
import { v4 } from 'uuid';

const appName = 'test-app';
const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('replay', function (): void {
  this.timeout(120_000);

  let api: ExpressApplication,
      application: Application,
      applicationDirectory: string,
      consumerProgressStore: ConsumerProgressStore,
      consumerProgressStoreOptions: ConsumerProgressStoreOptions,
      domainEventStore: DomainEventStore,
      domainEventStoreOptions: DomainEventStoreOptions,
      requestedReplays: {
        flowNames: string[];
        aggregates: {
          aggregateIdentifier: AggregateIdentifier;
          from: number;
          to: number;
        }[];
      }[],
      suffix: string;

  suiteSetup(async (): Promise<void> => {
    applicationDirectory = path.join(await isolated(), appName);

    shell.exec(
      `node ${cliPath} --verbose init --directory ${applicationDirectory} --template chat --language javascript ${appName}`
    );
    shell.exec(
      `npm install --production`,
      { cwd: applicationDirectory }
    );
    shell.exec(
      `node ${cliPath} build`,
      { cwd: applicationDirectory }
    );

    application = await loadApplication({ applicationDirectory });
  });

  setup(async (): Promise<void> => {
    suffix = getShortId();
    requestedReplays = [];

    domainEventStoreOptions = {
      type: 'MySql',
      ...connectionOptions.mySql,
      tableNames: {
        domainEvents: `domainevents_${suffix}`,
        snapshots: `snapshots_${suffix}`
      }
    };
    domainEventStore = await createDomainEventStore(domainEventStoreOptions);
    await domainEventStore.setup();

    consumerProgressStoreOptions = {
      type: 'MySql',
      ...connectionOptions.mySql,
      tableNames: {
        progress: `progress_${suffix}`
      }
    };
    consumerProgressStore = await createConsumerProgressStore(consumerProgressStoreOptions);
    await consumerProgressStore.setup();

    ({ api } = await getApi({
      corsOrigin: '*',
      async performReplay ({ flowNames, aggregates }): Promise<void> {
        requestedReplays.push({ flowNames, aggregates });
      },
      application
    }));
  });

  test('performs a replay for all aggregates in all contexts without resetting the flows.', async (): Promise<void> => {
    const domainEvents = [
      buildDomainEvent({
        aggregateIdentifier: {
          context: { name: 'communication' },
          aggregate: { name: 'message', id: v4() }
        },
        name: 'sent',
        data: { text: 'hello world' },
        metadata: {
          revision: 1
        }
      })
    ];

    await domainEventStore.storeDomainEvents({ domainEvents });

    await consumerProgressStore.setProgress({
      consumerId: 'messages',
      aggregateIdentifier: domainEvents[0].aggregateIdentifier,
      revision: 1
    });

    const { socket } = await runAsServer({ app: api });

    const replayCommand = oneLine`
      node ${cliPath} replay
        --replay-configuration '{"flows":["messages"]}'
        --replay-api-protocol http
        --replay-api-base-path '/v2'
        --replay-api-socket ${socket}
        --consumer-progress-store-options '${JSON.stringify(consumerProgressStoreOptions)}'
        --domain-event-store-options '${JSON.stringify(domainEventStoreOptions)}'
      `;

    const code = await new Promise((resolve, reject): void => {
      try {
        shell.exec(
          replayCommand,
          { cwd: applicationDirectory },
          (innerCode): void => {
            resolve(innerCode);
          }
        );
      } catch (ex: unknown) {
        reject(ex);
      }
    });

    assert.that(code).is.equalTo(0);
    assert.that(requestedReplays).is.equalTo([{
      flowNames: [ 'messages' ],
      aggregates: [
        {
          aggregateIdentifier: domainEvents[0].aggregateIdentifier,
          from: 1,
          to: 1
        }
      ]
    }]);
    assert.that(await consumerProgressStore.getProgress({
      consumerId: 'messages',
      aggregateIdentifier: domainEvents[0].aggregateIdentifier
    })).is.equalTo({ revision: 1, isReplaying: { from: 1, to: 1 }});
  });

  test('performs a replay for all specified aggregates from and to the specified revisions.', async (): Promise<void> => {
    const sharedId = v4();

    const domainEvents = [
      buildDomainEvent({
        aggregateIdentifier: {
          context: { name: 'communication' },
          aggregate: { name: 'message', id: v4() }
        },
        name: 'sent',
        data: { text: 'hello world' },
        metadata: {
          revision: 1
        }
      }),
      buildDomainEvent({
        aggregateIdentifier: {
          context: { name: 'communication' },
          aggregate: { name: 'message', id: sharedId }
        },
        name: 'sent',
        data: { text: 'hello world' },
        metadata: {
          revision: 1
        }
      }),
      buildDomainEvent({
        aggregateIdentifier: {
          context: { name: 'communication' },
          aggregate: { name: 'message', id: sharedId }
        },
        name: 'liked',
        data: { likes: 1 },
        metadata: {
          revision: 2
        }
      }),
      buildDomainEvent({
        aggregateIdentifier: {
          context: { name: 'communication' },
          aggregate: { name: 'message', id: sharedId }
        },
        name: 'liked',
        data: { likes: 2 },
        metadata: {
          revision: 3
        }
      })
    ];

    await domainEventStore.storeDomainEvents<any>({ domainEvents });

    await consumerProgressStore.setProgress({
      consumerId: 'messages',
      aggregateIdentifier: domainEvents[0].aggregateIdentifier,
      revision: 1
    });
    await consumerProgressStore.setProgress({
      consumerId: 'messages',
      aggregateIdentifier: domainEvents[1].aggregateIdentifier,
      revision: 3
    });

    const { socket } = await runAsServer({ app: api });

    const replayCommand = oneLine`
      node ${cliPath} replay
        --replay-configuration '${JSON.stringify({
    flows: [ 'messages' ],
    contexts: [{
      contextName: 'communication',
      aggregates: [{
        aggregateName: 'message',
        instances: [{
          aggregateId: domainEvents[1].aggregateIdentifier.aggregate.id,
          from: 2,
          to: 3
        }]
      }]
    }]
  })}'
        --replay-api-protocol http
        --replay-api-base-path '/v2'
        --replay-api-socket ${socket}
        --consumer-progress-store-options '${JSON.stringify(consumerProgressStoreOptions)}'
        --domain-event-store-options '${JSON.stringify(domainEventStoreOptions)}'
      `;

    const code = await new Promise((resolve, reject): void => {
      try {
        shell.exec(
          replayCommand,
          { cwd: applicationDirectory },
          (innerCode): void => {
            resolve(innerCode);
          }
        );
      } catch (ex: unknown) {
        reject(ex);
      }
    });

    assert.that(code).is.equalTo(0);
    assert.that(requestedReplays).is.equalTo([{
      flowNames: [ 'messages' ],
      aggregates: [
        {
          aggregateIdentifier: domainEvents[1].aggregateIdentifier,
          from: 2,
          to: 3
        }
      ]
    }]);
    assert.that(await consumerProgressStore.getProgress({
      consumerId: 'messages',
      aggregateIdentifier: domainEvents[0].aggregateIdentifier
    })).is.equalTo({ revision: 1, isReplaying: false });
    assert.that(await consumerProgressStore.getProgress({
      consumerId: 'messages',
      aggregateIdentifier: domainEvents[1].aggregateIdentifier
    })).is.equalTo({ revision: 3, isReplaying: { from: 2, to: 3 }});
  });

  suite('--dangerously-reevaluate', (): void => {
    test('performs a replay and resets the flows.', async (): Promise<void> => {
      const domainEvents = [
        buildDomainEvent({
          aggregateIdentifier: {
            context: { name: 'communication' },
            aggregate: { name: 'message', id: v4() }
          },
          name: 'sent',
          data: { text: 'hello world' },
          metadata: {
            revision: 1
          }
        })
      ];

      await domainEventStore.storeDomainEvents({ domainEvents });

      await consumerProgressStore.setProgress({
        consumerId: 'messages',
        aggregateIdentifier: domainEvents[0].aggregateIdentifier,
        revision: 1
      });

      const { socket } = await runAsServer({ app: api });

      const replayCommand = oneLine`
      node ${cliPath} replay
        --replay-configuration '{"flows":["messages"]}'
        --replay-api-protocol http
        --replay-api-base-path '/v2'
        --replay-api-socket ${socket}
        --consumer-progress-store-options '${JSON.stringify(consumerProgressStoreOptions)}'
        --domain-event-store-options '${JSON.stringify(domainEventStoreOptions)}'
        --dangerously-reevaluate
      `;

      const code = await new Promise((resolve, reject): void => {
        try {
          shell.exec(
            replayCommand,
            { cwd: applicationDirectory },
            (innerCode): void => {
              resolve(innerCode);
            }
          );
        } catch (ex: unknown) {
          reject(ex);
        }
      });

      assert.that(code).is.equalTo(0);
      assert.that(requestedReplays).is.equalTo([{
        flowNames: [ 'messages' ],
        aggregates: [
          {
            aggregateIdentifier: domainEvents[0].aggregateIdentifier,
            from: 1,
            to: 1
          }
        ]
      }]);
      assert.that(await consumerProgressStore.getProgress({
        consumerId: 'messages',
        aggregateIdentifier: domainEvents[0].aggregateIdentifier
      })).is.equalTo({ revision: 0, isReplaying: { from: 1, to: 1 }});
    });
  });
});
