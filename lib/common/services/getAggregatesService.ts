import { AggregatesService } from './AggregatesService';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { errors } from '../errors';
import { Repository } from '../domain/Repository';
import { State } from '../elements/State';

const getAggregatesService = function ({ applicationDefinition, repository }: {
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
}): AggregatesService {
  const aggregatesService: AggregatesService = {};

  for (const [ contextName, contextConfiguration ] of Object.entries(applicationDefinition.domain)) {
    const aggregatesInContext: Record<string, (aggregateId: string) => {
      read: <TState extends State> () => Promise<TState>;
    }> = {};

    for (const aggregateName of Object.keys(contextConfiguration)) {
      aggregatesInContext[aggregateName] = function (aggregateId: string): {
        read: <TState extends State> () => Promise<TState>;
      } {
        return {
          async read <TState extends State> (): Promise<TState> {
            const aggregate = await repository.loadCurrentAggregateState<TState>({
              contextIdentifier: { name: contextName },
              aggregateIdentifier: { name: aggregateName, id: aggregateId }
            });

            if (!aggregate.exists()) {
              throw new errors.AggregateNotFound(`Aggregate '${contextName}.${aggregateName}.${aggregateId}' not found.`);
            }

            return aggregate.state;
          }
        };
      };
    }

    aggregatesService[contextName] = aggregatesInContext;
  }

  return aggregatesService;
};

export { getAggregatesService };
