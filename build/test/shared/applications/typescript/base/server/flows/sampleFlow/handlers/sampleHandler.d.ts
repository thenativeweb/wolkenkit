import { Infrastructure } from '../../../infrastructure';
import { ExecutedData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/executed';
import { FlowHandler } from 'wolkenkit';
export declare const sampleHandler: FlowHandler<ExecutedData, Infrastructure>;
