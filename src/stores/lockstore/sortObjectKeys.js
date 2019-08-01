'use strict';

const sortObjectKeys = function ({ object, recursive = false }) {
  if (typeof object !== 'object' || Array.isArray(object)) {
    return object;
  }

  return Object.
    keys(object).
    sort().
    reduce((acc, key) => {
      let value = object[key];

      if (recursive && typeof value === 'object' && !Array.isArray(value)) {
        value = sortObjectKeys({
          object: value,
          recursive
        });
      }

      return { ...acc, [key]: value };
    }, {});
};

module.exports = sortObjectKeys;
