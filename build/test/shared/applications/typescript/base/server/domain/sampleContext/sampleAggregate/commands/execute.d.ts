import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
import { CommandData, CommandHandler } from 'wolkenkit';
export interface ExecuteData extends CommandData {
    strategy: 'succeed' | 'fail' | 'reject';
}
export declare const execute: CommandHandler<SampleState, ExecuteData, Infrastructure>;
