import { Application } from '../../../../common/application/Application';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { getDomainEventsFieldConfiguration } from './getDomainEventsFieldConfiguration';
import { getDomainEventWithStateSchema } from '../../../../common/schemas/getDomainEventWithStateSchema';
import { GraphQLFieldConfig } from 'graphql';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { ResolverContext } from '../ResolverContext';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { Value } from 'validate-value';

const domainEventWithStateSchema = new Value(getDomainEventWithStateSchema());

const getSubscriptionSchema = function ({ application, repository }: {
  application: Application;
  repository: Repository;
}): { schema: GraphQLFieldConfig<any, ResolverContext>; publishDomainEvent: PublishDomainEvent } {
  const domainEventEmitter = new SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>();
  const publishDomainEvent = function ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): void {
    try {
      domainEventWithStateSchema.validate(domainEvent, { valueName: 'domainEvent' });
    } catch (ex: unknown) {
      throw new errors.DomainEventMalformed((ex as Error).message);
    }
    validateDomainEventWithState({ domainEvent, application });

    domainEventEmitter.emit(domainEvent);
  };

  const schema = getDomainEventsFieldConfiguration({
    application,
    repository,
    domainEventEmitter
  });

  return {
    schema,
    publishDomainEvent
  };
};

export { getSubscriptionSchema };
