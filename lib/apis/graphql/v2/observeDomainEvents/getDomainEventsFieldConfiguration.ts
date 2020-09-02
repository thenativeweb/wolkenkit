import { Application } from '../../../../common/application/Application';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { getAggregatesService } from '../../../../common/services/getAggregatesService';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getClientService } from '../../../../common/services/getClientService';
import { getDomainEventSchemaForGraphql } from '../../../../common/schemas/getDomainEventSchemaForGraphql';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { partOf } from 'partof';
import { prepareForPublication } from '../../../../common/domain/domainEvent/prepareForPublication';
import { Repository } from '../../../../common/domain/Repository';
import { ResolverContext } from '../ResolverContext';
import { Schema } from '../../../../common/elements/Schema';
import { source } from 'common-tags';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { transformDomainEventForGraphql } from '../../shared/elements/transformDomainEventForGraphql';
import { buildSchema, GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from 'graphql';

const getDomainEventsFieldConfiguration = function ({ application, repository, domainEventEmitter }: {
  application: Application;
  repository: Repository;
  domainEventEmitter: SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>;
}): GraphQLFieldConfig<any, ResolverContext> {
  const aggregatesService = getAggregatesService({ repository });
  const domainEventSchema: Schema = getDomainEventSchemaForGraphql();
  const domainEventGraphQL = getGraphqlFromJsonSchema({
    schema: domainEventSchema,
    rootName: 'DomainEvent',
    direction: 'output'
  });

  let description = '';
  const applicationDescription = getApplicationDescription({ application });

  for (const [ contextName, context ] of Object.entries(applicationDescription.domainEvents)) {
    description += `# Context '${contextName}'\n`;
    for (const [ aggregateName, aggregate ] of Object.entries(context)) {
      description += `## Aggregate '${aggregateName}'\n`;
      for (const [ domainEventName, domainEventDescription ] of Object.entries(aggregate)) {
        description += source`
          ### Domain Event '${domainEventName}'

          ${domainEventDescription.documentation ?? 'No documentation available.'}

              ${domainEventDescription.schema ? JSON.stringify(domainEventDescription.schema, null, 2) : 'No schema found.'}
        `;
        description += '\n';
      }
    }
  }

  return {
    type: buildSchema(domainEventGraphQL.typeDefinitions.join('\n')).getType(domainEventGraphQL.typeName) as GraphQLObjectType,
    args: {
      filter: {
        type: GraphQLString
      }
    },
    description,
    async * subscribe (
      _source,
      { filter: jsonFilter },
      { clientMetadata }: ResolverContext
    ): AsyncIterator<DomainEventWithState<DomainEventData, State>> {
      const clientService = getClientService({ clientMetadata });
      let filter: any = {};

      try {
        if (jsonFilter) {
          filter = JSON.parse(jsonFilter);
        }
      } catch {
        throw new errors.ParameterInvalid('Filter must be a valid JSON object.');
      }

      for await (const [ domainEvent ] of domainEventEmitter) {
        if (!partOf(filter, domainEvent)) {
          continue;
        }

        const preparedDomainEvent = await prepareForPublication({
          application,
          domainEventWithState: domainEvent,
          domainEventFilter: {},
          repository,
          services: {
            aggregates: aggregatesService,
            client: clientService,
            logger: getLoggerService({
              fileName: `<app>/server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/`,
              packageManifest: application.packageManifest
            }),
            infrastructure: {
              ask: application.infrastructure.ask
            }
          }
        });

        if (!preparedDomainEvent) {
          continue;
        }

        yield transformDomainEventForGraphql({
          domainEvent: preparedDomainEvent
        });
      }
    },
    resolve (domainEvent): any {
      return domainEvent;
    }
  };
};

export { getDomainEventsFieldConfiguration };
