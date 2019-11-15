import { getSchema } from './getSchema';
import { OwnedAuthorizationOptions } from './AuthorizationOptions';
import { Value } from 'validate-value';

const isValid = function (isAuthorized: OwnedAuthorizationOptions): boolean {
  const schema = getSchema();
  const value = new Value(schema);

  const isAuthorizedValid = value.isValid(isAuthorized);

  return isAuthorizedValid;
};

export { isValid };
