import { Hooks } from '../elements/Hooks';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseHooks: ({ hooksDefinition }: {
    hooksDefinition: any;
}) => Result<Hooks<any>, errors.HooksDefinitionMalformed>;
export { parseHooks };
