import { camelCase, mapKeys } from 'lodash';

const withCamelCaseKeys = function (object: object): object {
  return mapKeys(object, (_value, key): string => camelCase(key));
};

export { withCamelCaseKeys };
