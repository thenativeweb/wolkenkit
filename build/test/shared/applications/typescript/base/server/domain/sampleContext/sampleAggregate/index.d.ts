import { Aggregate } from 'wolkenkit';
import { Infrastructure } from '../../../infrastructure';
import { SampleState } from './SampleState';
declare const sampleAggregate: Aggregate<SampleState, Infrastructure>;
export default sampleAggregate;
