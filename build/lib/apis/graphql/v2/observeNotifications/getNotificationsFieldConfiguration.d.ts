import { Application } from '../../../../common/application/Application';
import { Notification } from '../../../../common/elements/Notification';
import { ResolverContext } from '../ResolverContext';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { GraphQLFieldConfig } from 'graphql';
declare const getNotificationsFieldConfiguration: ({ application, notificationEmitter }: {
    application: Application;
    notificationEmitter: SpecializedEventEmitter<Notification>;
}) => GraphQLFieldConfig<any, ResolverContext>;
export { getNotificationsFieldConfiguration };
