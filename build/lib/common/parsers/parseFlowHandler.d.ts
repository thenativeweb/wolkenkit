import { FlowHandler } from '../elements/FlowHandler';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseFlowHandler: ({ domainEventHandler }: {
    domainEventHandler: any;
}) => Result<FlowHandler<any, any>, errors.FlowDomainEventHandlerMalformed>;
export { parseFlowHandler };
