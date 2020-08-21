'use strict';

const setupInfrastructure = async function () {
  // eslint-disable-next-line no-console
  console.log('Setting up the infrastructure...');
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
