import { AskInfrastructure } from '../elements/AskInfrastructure';
import { InfrastructureDefinition } from './InfrastructureDefinition';
import { TellInfrastructure } from '../elements/TellInfrastructure';
declare const getInfrastructureDefinition: ({ infrastructureDirectory }: {
    infrastructureDirectory: string;
}) => Promise<InfrastructureDefinition<AskInfrastructure, TellInfrastructure>>;
export { getInfrastructureDefinition };
