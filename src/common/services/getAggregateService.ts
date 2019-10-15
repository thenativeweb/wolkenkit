import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { AggregateService } from './AggregateService';
import Application from '../application';
import { Dictionary } from '../../types/Dictionary';
import errors from '../errors';
import Repository from '../domain/Repository';

const getAggregateService = function ({ application, repository }: {
  application: Application;
  repository: Repository;
}): AggregateService {
  const aggregateService: Partial<AggregateService> = {};

  for (const [ contextName, contextConfiguration ] of Object.entries(application.initialState.internal)) {
    if (!contextConfiguration) {
      throw new errors.InvalidOperation();
    }

    const aggregatesInContext: Dictionary<(aggregateId: string) => {
      read: () => Promise<AggregateApiForReadOnly>;
    }> = {};

    for (const aggregateName of Object.keys(contextConfiguration)) {
      aggregatesInContext[aggregateName] = function (aggregateId: string): {
        read: () => Promise<AggregateApiForReadOnly>;
      } {
        return {
          async read (): Promise<AggregateApiForReadOnly> {
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
      };
    }

    aggregateService[contextName] = aggregatesInContext;
  }

  return aggregateService as AggregateService;
};

export default getAggregateService;
