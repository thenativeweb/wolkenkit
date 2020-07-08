import { getInfrastructure } from './getInfrastructure';
import { setupInfrastructure } from './setupInfrastructure';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
  ask: {};
  tell: {};
}

export default { getInfrastructure, setupInfrastructure };
