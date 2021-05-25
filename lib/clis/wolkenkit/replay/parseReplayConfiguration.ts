import { Application } from '../../../common/application/Application';
import { Parser } from 'validate-value';
import { ReplayConfiguration } from './ReplayConfiguration';
import { error, Result, value } from 'defekt';
import * as errors from '../../../common/errors';

const replayConfigurationParser = new Parser({
  type: 'object',
  properties: {
    flows: {
      type: 'array',
      items: { type: 'string', minLength: 1 }
    },
    contexts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contextName: { type: 'string' },
          aggregates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                aggregateName: { type: 'string' },
                instances: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      aggregateId: { type: 'string', format: 'uuid' },
                      from: { type: 'number', minimum: 1 },
                      to: { type: 'number', minimum: 1 }
                    },
                    required: [ 'aggregateId' ],
                    additionalProperties: false
                  }
                }
              },
              required: [ 'aggregateName' ],
              additionalProperties: false
            }
          }
        },
        required: [ 'contextName' ],
        additionalProperties: false
      }
    }
  },
  required: [],
  additionalProperties: false
});
const parseReplayConfiguration = function ({ application, replayConfiguration }: {
  application: Application;
  replayConfiguration: any;
}): Result<ReplayConfiguration, errors.ReplayConfigurationInvalid> {
  replayConfigurationParser.parse(
    replayConfiguration,
    { valueName: 'replayConfiguration' }
  ).unwrapOrThrow(
    (err): Error => new errors.ReplayConfigurationInvalid({ cause: err })
  );

  const typeSafeReplayConfiguration: ReplayConfiguration = replayConfiguration;

  if (typeSafeReplayConfiguration.flows) {
    for (const flowName of typeSafeReplayConfiguration.flows) {
      if (!(flowName in application.flows)) {
        return error(new errors.ReplayConfigurationInvalid(`Flow '${flowName}' not found.`));
      }
    }
  }

  if (typeSafeReplayConfiguration.contexts) {
    const seenContextNames: Set<string> = new Set();

    for (const context of typeSafeReplayConfiguration.contexts) {
      if (!(context.contextName in application.domain)) {
        return error(new errors.ReplayConfigurationInvalid(`Context '${context.contextName}' not found.`));
      }

      if (seenContextNames.has(context.contextName)) {
        return error(new errors.ReplayConfigurationInvalid(`Context '${context.contextName}' is duplicated.`));
      }
      seenContextNames.add(context.contextName);

      if (context.aggregates) {
        const seenAggregateNames: Set<string> = new Set();

        for (const aggregate of context.aggregates) {
          if (!(aggregate.aggregateName in application.domain[context.contextName])) {
            return error(new errors.ReplayConfigurationInvalid(`Aggregate '${context.contextName}.${aggregate.aggregateName}' not found.`));
          }

          if (seenAggregateNames.has(aggregate.aggregateName)) {
            return error(new errors.ReplayConfigurationInvalid(`Aggregate '${context.contextName}.${aggregate.aggregateName}' is duplicated.`));
          }
          seenAggregateNames.add(aggregate.aggregateName);

          if (aggregate.instances) {
            const seenInstanceIds: Set<string> = new Set();

            for (const instance of aggregate.instances) {
              if (seenInstanceIds.has(instance.aggregateId)) {
                return error(new errors.ReplayConfigurationInvalid(`Aggregate instance '${context.contextName}.${aggregate.aggregateName}.${instance.aggregateId}' is duplicated.`));
              }
              seenInstanceIds.add(instance.aggregateId);

              if (instance.from && instance.to && instance.from > instance.to) {
                return error(new errors.ReplayConfigurationInvalid(`Can not replay from ${instance.from} to ${instance.to} for aggregate '${context.contextName}.${aggregate.aggregateName}'.`));
              }
            }
          }
        }
      }
    }
  }

  return value(replayConfiguration);
};

export {
  parseReplayConfiguration
};
