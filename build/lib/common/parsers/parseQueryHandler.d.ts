import { QueryHandlerReturnsStream } from '../elements/QueryHandlerReturnsStream';
import { QueryHandlerReturnsValue } from '../elements/QueryHandlerReturnsValue';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseQueryHandler: ({ queryHandler }: {
    queryHandler: any;
}) => Result<QueryHandlerReturnsStream<any, any> | QueryHandlerReturnsValue<any, any>, errors.QueryHandlerMalformed>;
export { parseQueryHandler };
