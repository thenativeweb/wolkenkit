import _, { isArray, isObject } from 'lodash';

const omitByDeep = function (object: any, predicate: (value: any, key: string) => boolean): any {
  if (!object || !isObject(object) || isArray(object)) {
    return object;
  }

  return _(object).
    omitBy(predicate).
    mapValues((value: any): any => omitByDeep(value, predicate)).
    value();
};

export default omitByDeep;
