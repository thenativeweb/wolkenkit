import { getInfrastructure } from './getInfrastructure';
import { setupInfrastructure } from './setupInfrastructure';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
  ask: object;
  tell: object;
}

export default { getInfrastructure, setupInfrastructure };
