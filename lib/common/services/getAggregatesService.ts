import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { AggregatesService } from './AggregatesService';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { errors } from '../errors';
import { GetAggregatesService } from './types/GetAggregatesService';
import { Repository } from '../domain/Repository';
import { State } from '../elements/State';

const getAggregatesService: GetAggregatesService = function ({ repository }: {
  repository: Repository;
}): AggregatesService {
  return {
    async read <TState extends State> ({ contextIdentifier, aggregateIdentifier }: {
      contextIdentifier: ContextIdentifier;
      aggregateIdentifier: AggregateIdentifier;
    }): Promise<TState> {
      const otherAggregateInstance = await repository.getAggregateInstance<TState>({
        contextIdentifier,
        aggregateIdentifier
      });

      if (otherAggregateInstance.isPristine()) {
        throw new errors.AggregateNotFound(`Aggregate '${contextIdentifier.name}.${aggregateIdentifier.name}.${aggregateIdentifier.id}' not found.`);
      }

      return otherAggregateInstance.state;
    }
  };
};

export { getAggregatesService };
