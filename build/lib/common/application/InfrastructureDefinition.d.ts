import { AskInfrastructure } from '../elements/AskInfrastructure';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from '../elements/TellInfrastructure';
export interface InfrastructureDefinition<TAskInfrastructure extends AskInfrastructure, TTellInfrastructure extends TellInfrastructure> {
    setupInfrastructure: (services: {
        logger: LoggerService;
    }) => Promise<void>;
    getInfrastructure: (services: {
        logger: LoggerService;
    }) => Promise<TAskInfrastructure & TTellInfrastructure>;
}
