import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { getAggregatesService } from '../../../../common/services/getAggregatesService';
import { getClientService } from '../../../../common/services/getClientService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { IResolverObject } from 'graphql-tools';
import { partOf } from 'partof';
import { prepareForPublication } from '../../../../common/domain/domainEvent/prepareForPublication';
import { Repository } from '../../../../common/domain/Repository';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { transformDomainEventForGraphql } from '../../shared/elements/transformDomainEventForGraphql';

const getSubscriptionResolvers = function ({ applicationDefinition, repository, domainEventEmitter }: {
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  domainEventEmitter: SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>;
}): IResolverObject<any, ClientMetadata> {
  const aggregatesService = getAggregatesService({ applicationDefinition, repository });

  return {
    domainEvents: {
      async * subscribe (_, { filter: jsonFilter }: { filter: undefined | string }, clientMetadata): AsyncIterator<DomainEventWithState<DomainEventData, State>> {
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
            applicationDefinition,
            domainEventWithState: domainEvent,
            domainEventFilter: {},
            repository,
            services: {
              aggregates: aggregatesService,
              client: clientService,
              logger: getLoggerService({
                fileName: `<app>/server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/`,
                packageManifest: applicationDefinition.packageManifest
              })
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
      async resolve (
        domainEvent: DomainEventWithState<DomainEventData, State>
      ): Promise<any> {
        return domainEvent;
      }
    }
  };
};

export { getSubscriptionResolvers };
