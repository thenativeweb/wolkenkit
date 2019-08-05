import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import Application from '../application';
import { Dictionary } from '../../types/Dictionary';
import { ReadAggregateService } from './ReadAggregateService';
import Repository from '../domain/Repository';

const getReadAggregateService = function ({ application, repository }: {
  application: Application;
  repository: Repository;
}): ReadAggregateService {
  const readAggregateService: Partial<ReadAggregateService> = {};

  for (const [ contextName, contextConfiguration ] of Object.entries(application.initialState.internal)) {
    if (!contextConfiguration) {
      continue;
    }

    const aggregatesInContext: Dictionary<(aggregateId: string) => {
      read: () => Promise<AggregateApiForReadOnly>
    }> = {};

    for (const aggregateName of Object.keys(contextConfiguration)) {
      aggregatesInContext[aggregateName] = function (aggregateId: string): {
        read: () => Promise<AggregateApiForReadOnly>
      } {
        return {
          async read () {
            const aggregate = await repository.loadAggregate({
              contextIdentifier: { name: contextName },
              aggregateIdentifier: { name: aggregateName, id: aggregateId }
            });

            if (!aggregate.exists()) {
              throw new Error('Aggregate not found.');
            }

            return new AggregateApiForReadOnly({ aggregate });
          }
        };
      }
    }

    readAggregateService[contextName] = aggregatesInContext;
  }

  return readAggregateService as ReadAggregateService;
};

export default getReadAggregateService;
