import { InfrastructureDefinition } from '../application/InfrastructureDefinition';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseInfrastructureDefinition: ({ infrastructureDefinition }: {
    infrastructureDefinition: any;
}) => Result<InfrastructureDefinition<any, any>, errors.InfrastructureDefinitionMalformed>;
export { parseInfrastructureDefinition };
