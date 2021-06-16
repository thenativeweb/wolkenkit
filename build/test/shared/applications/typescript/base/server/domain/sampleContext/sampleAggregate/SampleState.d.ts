import { GetInitialState, State } from 'wolkenkit';
export interface SampleState extends State {
    domainEventNames: string[];
}
export declare const getInitialState: GetInitialState<SampleState>;
