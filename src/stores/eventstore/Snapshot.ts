import { State } from '../../common/elements/State';

export interface Snapshot {
  revision: number;
  state: State;
}
