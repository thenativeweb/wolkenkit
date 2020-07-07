import { AskInfrastructure } from '../elements/AskInfrastructure';
import { TellInfrastructure } from '../elements/TellInfrastructure';

export interface InfrastructureDefinition<
  TAskInfrastructure extends AskInfrastructure,
  TTellInfrastructure extends TellInfrastructure
> {
  setupInfrastructure: () => Promise<void>;
  getInfrastructure: () => Promise<TAskInfrastructure & TTellInfrastructure>;
}
