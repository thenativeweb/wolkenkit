import { get } from 'lodash';
import { OwnedAuthorizationOptions } from './AuthorizationOptions';

const hasAccess = function ({ user, to, authorizationOptions, isConstructor = false }: {
  user: any;
  to: string;
  authorizationOptions: OwnedAuthorizationOptions;
  isConstructor?: boolean;
}): boolean {
  const authorizationOptionsForResource = get(authorizationOptions, to);

  if (!authorizationOptionsForResource) {
    throw new Error(`Resource '${to}' does not exist.`);
  }

  const { forAuthenticated, forPublic } = authorizationOptionsForResource;
  const { owner } = authorizationOptions;

  if (forPublic) {
    return true;
  }
  if (forAuthenticated && user.sub !== 'anonymous') {
    return true;
  }
  if (!isConstructor && user.sub === owner) {
    return true;
  }

  return false;
};

export { hasAccess };
