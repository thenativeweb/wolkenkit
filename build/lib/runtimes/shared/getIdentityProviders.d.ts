import { IdentityProvider } from 'limes';
import { IdentityProvidersEnvironmentVariable } from './IdentityProvidersEnvironmentVariable';
declare const getIdentityProviders: ({ identityProvidersEnvironmentVariable }: {
    identityProvidersEnvironmentVariable: IdentityProvidersEnvironmentVariable;
}) => Promise<IdentityProvider[]>;
export { getIdentityProviders };
