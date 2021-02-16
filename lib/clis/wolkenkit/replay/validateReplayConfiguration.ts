import { Application } from '../../../common/application/Application';
import { errors } from '../../../common/errors';
import { ReplayConfiguration } from './ReplayConfiguration';
import { Value } from 'validate-value';

const validateReplayConfiguration = function ({ application, replayConfiguration }: {
  application: Application;
  replayConfiguration: any;
}): void {
  const value = new Value({
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

  try {
    value.validate(replayConfiguration, { valueName: 'replayConfiguration' });
  } catch (ex: unknown) {
    throw new errors.ReplayConfigurationInvalid(undefined, { cause: ex });
  }

  const typeSafeReplayConfiguration: ReplayConfiguration = replayConfiguration;

  if (typeSafeReplayConfiguration.flows) {
    for (const flowName of typeSafeReplayConfiguration.flows) {
      if (!(flowName in application.flows)) {
        throw new errors.ReplayConfigurationInvalid(`Flow '${flowName}' not found.`);
      }
    }
  }

  if (typeSafeReplayConfiguration.contexts) {
    const seenContextNames: Set<string> = new Set();

    for (const context of typeSafeReplayConfiguration.contexts) {
      if (!(context.contextName in application.domain)) {
        throw new errors.ReplayConfigurationInvalid(`Context '${context.contextName}' not found.`);
      }

      if (seenContextNames.has(context.contextName)) {
        throw new errors.ReplayConfigurationInvalid(`Context '${context.contextName}' is duplicated.`);
      }
      seenContextNames.add(context.contextName);

      if (context.aggregates) {
        const seenAggregateNames: Set<string> = new Set();

        for (const aggregate of context.aggregates) {
          if (!(aggregate.aggregateName in application.domain[context.contextName])) {
            throw new errors.ReplayConfigurationInvalid(`Aggregate '${context.contextName}.${aggregate.aggregateName}' not found.`);
          }

          if (seenAggregateNames.has(aggregate.aggregateName)) {
            throw new errors.ReplayConfigurationInvalid(`Aggregate '${context.contextName}.${aggregate.aggregateName}' is duplicated.`);
          }
          seenAggregateNames.add(aggregate.aggregateName);

          if (aggregate.instances) {
            const seenInstanceIds: Set<string> = new Set();

            for (const instance of aggregate.instances) {
              if (seenInstanceIds.has(instance.aggregateId)) {
                throw new errors.ReplayConfigurationInvalid(`Aggregate instance '${context.contextName}.${aggregate.aggregateName}.${instance.aggregateId}' is duplicated.`);
              }
              seenInstanceIds.add(instance.aggregateId);

              if (instance.from && instance.to && instance.from > instance.to) {
                throw new errors.ReplayConfigurationInvalid(`Can not replay from ${instance.from} to ${instance.to} for aggregate '${context.contextName}.${aggregate.aggregateName}'.`);
              }
            }
          }
        }
      }
    }
  }
};

export {
  validateReplayConfiguration
};
