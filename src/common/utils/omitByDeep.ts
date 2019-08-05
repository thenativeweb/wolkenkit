import _, { cloneDeepWith, omitBy, isArray, isObject } from 'lodash';

const omitByDeep = function (object: any, predicate: (value: any, key: string) => boolean): any {
  if (!object || !isObject(object) || isArray(object)) {
    return object;
  }

  return _(object).
    omitBy(predicate).
    mapValues(value => omitByDeep(value, predicate)).
    value();
};

// const omitByDeep = function <T extends object> (object: T | undefined, predicate: (value: T[keyof T], key: string) => boolean): T | undefined {
//   if (!object || !isObject(object) || isArray(object)) {
//     return object;
//   }
//
//   return _(object).
//     omitBy(predicate).
//     mapValues(value => omitByDeep(value, predicate)).
//     value();
// };

// const omitByDeep = function <T extends object> (object: T, predicate: (value: T[keyof T], key: string) => boolean) {
//   const omitFn = function (value: T) {
//     const result = omitBy(value, predicate);
//
//     return omitByDeep(result, predicate);
//   }
//
//   return cloneDeepWith(object, omitFn);
// }

export default omitByDeep;


const foo = {
  a: 23,
  b: 42,
  c: {
    d: 68
  }
};

const result = omitByDeep(foo, (value, key) => value > 28);

console.log('#####', result);
