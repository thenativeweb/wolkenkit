import { State } from '../elements/State';

export type StateDefinitions = Record<string, Record<string, new () => State>>;
