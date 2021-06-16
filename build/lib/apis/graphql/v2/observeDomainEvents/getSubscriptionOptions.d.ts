import { SubscriptionServerOptions } from 'apollo-server-core/src/types';
import { IdentityProvider } from 'limes';
declare const getSubscriptionOptions: ({ identityProviders, webSocketEndpoint, issuerForAnonymousTokens }: {
    identityProviders: IdentityProvider[];
    webSocketEndpoint: string;
    issuerForAnonymousTokens: string;
}) => SubscriptionServerOptions;
export { getSubscriptionOptions };
