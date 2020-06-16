import { AggregatesService } from './AggregatesService';
import { errors } from '../errors';
import { GetAggregatesService } from './types/GetAggregatesService';
import { Repository } from '../domain/Repository';
import { State } from '../elements/State';

const getAggregatesService: GetAggregatesService = function ({ repository }: {
  repository: Repository;
}): AggregatesService {
  const aggregatesService: AggregatesService = {};

  for (const [ contextName, contextConfiguration ] of Object.entries(repository.applicationDefinition.domain)) {
    const aggregatesInContext: Record<string, (aggregateId: string) => {
      read: <TState extends State> () => Promise<TState>;
    }> = {};

    for (const aggregateName of Object.keys(contextConfiguration)) {
      aggregatesInContext[aggregateName] = function (aggregateId: string): {
        read: <TState extends State> () => Promise<TState>;
      } {
        return {
          async read <TState extends State> (): Promise<TState> {
            const otherAggregateInstance = await repository.getAggregateInstance<TState>({
              contextIdentifier: { name: contextName },
              aggregateIdentifier: { name: aggregateName, id: aggregateId }
            });

            if (otherAggregateInstance.isPristine()) {
              throw new errors.AggregateNotFound(`Aggregate '${contextName}.${aggregateName}.${aggregateId}' not found.`);
            }

            return otherAggregateInstance.state;
          }
        };
      };
    }

    aggregatesService[contextName] = aggregatesInContext;
  }

  return aggregatesService;
};

export { getAggregatesService };
