import { ApplicationDefinition } from '../../lib/common/application/ApplicationDefinition';

export type ApplicationEnhancer = (applicationDefinition: ApplicationDefinition) => ApplicationDefinition;
