import { AggregatesService } from './AggregatesService';
import { Application } from '../application';
import { Repository } from '../domain/Repository';

const getAggregatesService = function ({ application, repository }: {
  application: Application;
  repository: Repository;
}): AggregatesService {
  const aggregatesService: Partial<AggregatesService> = {};

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

    aggregatesService[contextName] = aggregatesInContext;
  }

  return aggregatesService as AggregatesService;
};

export { getAggregatesService };
