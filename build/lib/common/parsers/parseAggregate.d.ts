import { Aggregate } from '../elements/Aggregate';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseAggregate: ({ aggregate }: {
    aggregate: any;
}) => Result<Aggregate<any, any>, errors.AggregateDefinitionMalformed>;
export { parseAggregate };
