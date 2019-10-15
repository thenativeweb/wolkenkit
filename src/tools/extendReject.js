'use strict';

const humanizeString = require('humanize-string');

const defaultValidators = {
  doesNotExist (aggregateInstance, command) {
    if (aggregateInstance.exists()) {
      return;
    }

    const aggregateName = humanizeString(command.aggregate.name);

    command.reject(`${aggregateName} does not exist.`);
  },

  exists (aggregateInstance, command) {
    if (!aggregateInstance.exists()) {
      return;
    }

    const aggregateName = humanizeString(command.aggregate.name);

    command.reject(`${aggregateName} already exists.`);
  }
};

const extendReject = function (validators = {}) {
  const mergedValidators = { ...defaultValidators };

  for (const [ name, validator ] of Object.entries(validators)) {
    if (defaultValidators[name]) {
      throw new Error(`Reserved name '${name}' can not be used.`);
    }

    mergedValidators[name] = validator;
  }

  const reject = function (command) {
    return {
      if (aggregateInstance) {
        const result = {};

        for (const [ name, validator ] of Object.entries(mergedValidators)) {
          result[name] = function () {
            return validator(aggregateInstance, command);
          };
        }

        return result;
      }
    };
  };

  return reject;
};

module.exports = extendReject;
