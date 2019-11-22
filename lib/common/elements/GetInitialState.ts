import { State } from './State';

export type GetInitialState<TState extends State> = () => TState;
