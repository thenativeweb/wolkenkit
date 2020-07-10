import { Collection } from 'mongodb';
import { getInfrastructure } from './getInfrastructure';
import { AggregateItem } from '../types/AggregateItem';
import { setupInfrastructure } from './setupInfrastructure';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
  ask: {
    viewStore: {
      aggregates: Collection<AggregateItem> | AggregateItem[];
    }
  };
  tell: {
    viewStore: {
      aggregates: Collection<AggregateItem> | AggregateItem[];
    };
  };
}

export default { getInfrastructure, setupInfrastructure };
