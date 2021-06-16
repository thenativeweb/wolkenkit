import { Application } from '../../../../common/application/Application';
import { GraphQLFieldConfig } from 'graphql';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { ResolverContext } from '../ResolverContext';
declare const getSubscriptionSchema: ({ application, repository }: {
    application: Application;
    repository: Repository;
}) => {
    schema: GraphQLFieldConfig<any, ResolverContext>;
    publishDomainEvent: PublishDomainEvent;
};
export { getSubscriptionSchema };
