import { AskInfrastructure } from '../elements/AskInfrastructure';
import { TellInfrastructure } from '../elements/TellInfrastructure';

export interface InfrastructureDefinition<
  TAskInfrastructure extends AskInfrastructure,
  TTellInfrastructure extends TellInfrastructure
> {
  getInfrastructure: () => Promise<TAskInfrastructure & TTellInfrastructure>;
}
