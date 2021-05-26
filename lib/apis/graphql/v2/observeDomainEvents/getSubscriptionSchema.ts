import { Application } from '../../../../common/application/Application';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { getDomainEventsFieldConfiguration } from './getDomainEventsFieldConfiguration';
import { getDomainEventWithStateSchema } from '../../../../common/schemas/getDomainEventWithStateSchema';
import { GraphQLFieldConfig } from 'graphql';
import { Parser } from 'validate-value';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { ResolverContext } from '../ResolverContext';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import * as errors from '../../../../common/errors';

const domainEventWithStateSchema = new Parser(getDomainEventWithStateSchema());

const getSubscriptionSchema = function ({ application, repository }: {
  application: Application;
  repository: Repository;
}): { schema: GraphQLFieldConfig<any, ResolverContext>; publishDomainEvent: PublishDomainEvent } {
  const domainEventEmitter = new SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>();
  const publishDomainEvent = function ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): void {
    domainEventWithStateSchema.parse(
      domainEvent,
      { valueName: 'domainEvent' }
    ).unwrapOrThrow(
      (err): Error => new errors.DomainEventMalformed(err.message)
    );
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
