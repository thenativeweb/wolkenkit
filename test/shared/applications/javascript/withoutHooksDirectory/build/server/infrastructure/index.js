'use strict';

const setupInfrastructure = async function () {
  // Intentionally left blank.
};

const getInfrastructure = async function () {
  const domainEvents = [];

  return {
    ask: {
      viewStore: {
        domainEvents
      }
    },
    tell: {
      viewStore: {
        domainEvents
      }
    }
  };
};

module.exports = { getInfrastructure, setupInfrastructure };
