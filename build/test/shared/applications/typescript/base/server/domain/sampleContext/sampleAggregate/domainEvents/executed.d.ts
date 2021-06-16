import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
import { DomainEventData, DomainEventHandler } from 'wolkenkit';
export interface ExecutedData extends DomainEventData {
    strategy: 'succeed' | 'fail' | 'reject';
}
export declare const executed: DomainEventHandler<SampleState, ExecutedData, Infrastructure>;
