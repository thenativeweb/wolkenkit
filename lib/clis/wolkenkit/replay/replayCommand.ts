import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { ConsumerProgressStoreOptions } from '../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { createConsumerProgressStore } from '../../../stores/consumerProgressStore/createConsumerProgressStore';
import { createDomainEventStore } from '../../../stores/domainEventStore/createDomainEventStore';
import { DomainEventStoreOptions } from '../../../stores/domainEventStore/DomainEventStoreOptions';
import { getApplicationRoot } from '../../../common/application/getApplicationRoot';
import { getConsumerProgressStoreOptionsSchema } from '../../../runtimes/shared/schemas/getConsumerProgressStoreOptionsSchema';
import { getDomainEventStoreOptionsSchema } from '../../../runtimes/shared/schemas/getDomainEventStoreOptionsSchema';
import { loadApplication } from '../../../common/application/loadApplication';
import { Client as ReplayClient } from '../../../apis/performReplay/http/v2/Client';
import { ReplayConfiguration } from './ReplayConfiguration';
import { ReplayOptions } from './ReplayOptions';
import { validateReplayConfiguration } from './validateReplayConfiguration';
import { Value } from 'validate-value';

const replayCommand = function (): Command<ReplayOptions> {
  return {
    name: 'replay',
    description: 'Replays the domain events for a number of flows and aggregates.',

    optionDefinitions: [
      {
        name: 'replay-api-protocol',
        description: `set the replay API protocol`,
        type: 'string',
        isRequired: false
      },
      {
        name: 'replay-api-host-name',
        description: `set the replay API host name`,
        type: 'string',
        isRequired: false
      },
      {
        name: 'replay-api-port',
        description: `set the replay API port`,
        type: 'number',
        isRequired: false
      },
      {
        name: 'replay-api-socket',
        description: `set the replay API socket`,
        type: 'string',
        isRequired: false
      },
      {
        name: 'replay-api-base-path',
        description: `set the replay API base path`,
        type: 'string',
        isRequired: false
      },
      {
        name: 'domain-event-store-options',
        type: 'string',
        isRequired: true
      },
      {
        name: 'consumer-progress-store-options',
        type: 'string',
        isRequired: true
      },
      {
        name: 'replay-configuration',
        alias: 'c',
        description: 'A map defining the flows and aggregates to replay',
        type: 'string',
        isRequired: true
      },
      {
        name: 'dangerously-reevaluate',
        description: `Reset the given flows' state before replaying. This forces flows to reevaluate all domain events in the replay, even if they have already seen them.`,
        type: 'boolean',
        defaultValue: false,
        isRequired: false
      }
    ],

    async handle ({ options: {
      'replay-api-protocol': replayApiProtocol,
      'replay-api-host-name': replayApiHostName,
      'replay-api-port': replayApiPort,
      'replay-api-socket': replayApiSocket,
      'replay-api-base-path': replayApiBasePath,
      'domain-event-store-options': rawDomainEventStoreOptions,
      'consumer-progress-store-options': rawConsumerProgressStoreOptions,
      'replay-configuration': rawReplayConfiguration,
      'dangerously-reevaluate': dangerouslyReevaluate,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );

      const domainEventStoreOptions = JSON.parse(rawDomainEventStoreOptions) as DomainEventStoreOptions;
      const domainEventStoreOptionsSchema = new Value(getDomainEventStoreOptionsSchema());
      const consumerProgressStoreOptions = JSON.parse(rawConsumerProgressStoreOptions) as ConsumerProgressStoreOptions;
      const consumerProgressStoreOptionsSchema = new Value(getConsumerProgressStoreOptionsSchema());

      domainEventStoreOptionsSchema.validate(domainEventStoreOptions);
      consumerProgressStoreOptionsSchema.validate(consumerProgressStoreOptions);

      const domainEventStore = await createDomainEventStore(domainEventStoreOptions);

      const consumerProgressStore = await createConsumerProgressStore(consumerProgressStoreOptions);

      const replayClient = new ReplayClient({
        protocol: replayApiProtocol ?? 'https',
        hostName: replayApiHostName ?? 'localhost',
        portOrSocket: replayApiPort ?? replayApiSocket ?? 3_000,
        path: replayApiBasePath ?? '/perform-replay/v2'
      });

      try {
        const applicationDirectory =
            await getApplicationRoot({ directory: process.cwd() });

        const application = await loadApplication({ applicationDirectory });

        const parsedReplayConfiguration = JSON.parse(rawReplayConfiguration);

        validateReplayConfiguration({
          application,
          replayConfiguration: parsedReplayConfiguration
        });

        const replayConfiguration: ReplayConfiguration = parsedReplayConfiguration;
        const aggregateConfigurationsWithOptionalRevisions: {
          aggregateIdentifier: AggregateIdentifier;
          from?: number;
          to?: number;
        }[] = [];

        if (!replayConfiguration.contexts) {
          for await (const aggregateIdentifier of await domainEventStore.getAggregateIdentifiers()) {
            aggregateConfigurationsWithOptionalRevisions.push({ aggregateIdentifier });
          }
        } else {
          for (const context of replayConfiguration.contexts) {
            if (!context.aggregates) {
              for (const aggregateName of Object.keys(application.domain[context.contextName])) {
                for await (const aggregateIdentifier of await domainEventStore.getAggregateIdentifiersByName({ contextName: context.contextName, aggregateName })) {
                  aggregateConfigurationsWithOptionalRevisions.push({ aggregateIdentifier });
                }
              }
            } else {
              for (const aggregate of context.aggregates) {
                if (!aggregate.instances) {
                  for await (const aggregateIdentifier of await domainEventStore.getAggregateIdentifiersByName({ contextName: context.contextName, aggregateName: aggregate.aggregateName })) {
                    aggregateConfigurationsWithOptionalRevisions.push({ aggregateIdentifier });
                  }
                } else {
                  for (const instance of aggregate.instances) {
                    const aggregateIdentifier = {
                      context: { name: context.contextName },
                      aggregate: { name: aggregate.aggregateName, id: instance.aggregateId }
                    };

                    aggregateConfigurationsWithOptionalRevisions.push({
                      aggregateIdentifier,
                      from: instance.from,
                      to: instance.to
                    });
                  }
                }
              }
            }
          }
        }

        const aggregateConfigurations: {
          aggregateIdentifier: AggregateIdentifier;
          from: number;
          to: number;
        }[] = [];

        for (const aggregateConfiguration of aggregateConfigurationsWithOptionalRevisions) {
          const { aggregateIdentifier } = aggregateConfiguration;

          aggregateConfigurations.push({
            aggregateIdentifier,
            from: aggregateConfiguration.from ?? 1,
            to: aggregateConfiguration.to ?? (await domainEventStore.getLastDomainEvent({ aggregateIdentifier }))!.metadata.revision
          });
        }

        const flowNames = replayConfiguration.flows ?? Object.keys(application.flows);

        for (const flowName of flowNames) {
          for (const aggregateConfiguration of aggregateConfigurations) {
            if (dangerouslyReevaluate) {
              await consumerProgressStore.resetProgressToRevision({
                consumerId: flowName,
                aggregateIdentifier: aggregateConfiguration.aggregateIdentifier,
                revision: aggregateConfiguration.from - 1
              });
            }

            await consumerProgressStore.setIsReplaying({
              consumerId: flowName,
              aggregateIdentifier: aggregateConfiguration.aggregateIdentifier,
              isReplaying: {
                from: aggregateConfiguration.from,
                to: aggregateConfiguration.to
              }
            });
          }
        }

        if (aggregateConfigurations.length === 0) {
          buntstift.warn('No aggregates found to perform replays for.');

          return;
        }

        await replayClient.performReplay({
          flowNames,
          aggregates: aggregateConfigurations
        });

        await domainEventStore.destroy();
        await consumerProgressStore.destroy();
      } catch (ex: unknown) {
        buntstift.error('Failed to perform the replay.');

        throw ex;
      }
    }
  };
};

export { replayCommand };
