import { DomainEventHandler } from '../elements/DomainEventHandler';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseDomainEventHandler: ({ domainEventHandler }: {
    domainEventHandler: any;
}) => Result<DomainEventHandler<any, any, any>, errors.DomainEventHandlerMalformed>;
export { parseDomainEventHandler };
