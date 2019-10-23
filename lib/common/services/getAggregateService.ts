import { AggregateService } from './AggregateService';
import Application from '../application';
import Repository from '../domain/Repository';

const getAggregateService = function ({ application, repository }: {
  application: Application;
  repository: Repository;
}): AggregateService {
  const aggregateService: Partial<AggregateService> = {};

  for (const [ contextName, contextConfiguration ] of Object.entries(application.initialState.internal)) {
    const aggregatesInContext: Record<string, (aggregateId: string) => {
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
