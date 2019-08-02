import { State } from '../../../common/elements/types/State';

export interface ISnapshot {
  revision: number;
  state: State;
}
