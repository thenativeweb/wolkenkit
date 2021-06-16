import { View } from '../elements/View';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseView: ({ viewDefinition }: {
    viewDefinition: any;
}) => Result<View<any>, errors.ViewDefinitionMalformed>;
export { parseView };
