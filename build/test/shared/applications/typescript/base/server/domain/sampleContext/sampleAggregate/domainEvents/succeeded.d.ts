import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
import { DomainEventData, DomainEventHandler } from 'wolkenkit';
export interface SucceededData extends DomainEventData {
}
export declare const succeeded: DomainEventHandler<SampleState, SucceededData, Infrastructure>;
