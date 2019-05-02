'use strict';

class AppService {
  constructor ({ application, repository, capabilities }) {
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!repository) {
      throw new Error('Repository is missing.');
    }
    if (!capabilities) {
      throw new Error('Capabilities are missing.');
    }

    const { readAggregates } = capabilities;

    if (!readAggregates) {
      throw new Error('At least one capability must be requested.');
    }

    if (readAggregates) {
      for (const [ contextName, contextDefinition ] of Object.entries(application.initialState.internal)) {
        this[contextName] = {};

        for (const aggregateName of Object.keys(contextDefinition)) {
          this[contextName][aggregateName] = function (aggregateId) {
            if (!aggregateId) {
              throw new Error('Aggregate id is missing.');
            }

            return {
              async read () {
                const aggregate = await repository.loadAggregate({
                  contextName,
                  aggregateName,
                  aggregateId
                });

                if (!aggregate.api.forReadOnly.exists()) {
                  throw new Error('Aggregate not found.');
                }

                return aggregate.api.forReadOnly;
              }
            };
          };
        }
      }
    }
  }
}

module.exports = AppService;
