import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { AggregatesService } from './AggregatesService';
import { errors } from '../errors';
import { GetAggregatesService } from './types/GetAggregatesService';
import { Repository } from '../domain/Repository';
import { State } from '../elements/State';

const getAggregatesService: GetAggregatesService = function ({ repository }: {
  repository: Repository;
}): AggregatesService {
  return {
    async read <TState extends State> ({ aggregateIdentifier }: {
      aggregateIdentifier: AggregateIdentifier;
    }): Promise<TState> {
      const otherAggregateInstance = await repository.getAggregateInstance<TState>({
        aggregateIdentifier
      });

      if (otherAggregateInstance.isPristine()) {
        throw new errors.AggregateNotFound(`Aggregate '${aggregateIdentifier.context.name}.${aggregateIdentifier.aggregate.name}.${aggregateIdentifier.aggregate.id}' not found.`);
      }

      return otherAggregateInstance.state;
    }
  };
};

export { getAggregatesService };
