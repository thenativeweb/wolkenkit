import { Application } from '../../../../common/application/Application';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { Repository } from '../../../../common/domain/Repository';
import { ResolverContext } from '../ResolverContext';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { GraphQLFieldConfig } from 'graphql';
declare const getDomainEventsFieldConfiguration: ({ application, repository, domainEventEmitter }: {
    application: Application;
    repository: Repository;
    domainEventEmitter: SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>;
}) => GraphQLFieldConfig<any, ResolverContext>;
export { getDomainEventsFieldConfiguration };
