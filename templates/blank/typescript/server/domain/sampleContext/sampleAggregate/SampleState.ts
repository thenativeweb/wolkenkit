import { GetInitialState, State } from 'wolkenkit';

export type SampleState = State;

export const getInitialState: GetInitialState<SampleState> = function (): SampleState {
  return {
    // ...
  };
};
