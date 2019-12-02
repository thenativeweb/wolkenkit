import { camelCase, mapKeys } from 'lodash';

const withCamelCaseKeys = function (object: object): object {
  return mapKeys(object, (value, key): string => camelCase(key));
};

export {
  withCamelCaseKeys
};
