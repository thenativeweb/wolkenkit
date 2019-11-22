// @ts-ignore
import { GetInitialState, State } from 'wolkenkit';

export interface SampleState extends State {
  domainEventNames: string[];
}

export const getInitialState: GetInitialState<SampleState> = function (): SampleState {
  return {
    domainEventNames: []
  };
};
