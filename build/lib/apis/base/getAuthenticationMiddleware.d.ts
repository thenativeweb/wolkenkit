import { WolkenkitRequestHandler } from './WolkenkitRequestHandler';
import { IdentityProvider } from 'limes';
declare const getAuthenticationMiddleware: ({ identityProviders }: {
    identityProviders: IdentityProvider[];
}) => Promise<WolkenkitRequestHandler>;
export { getAuthenticationMiddleware };
