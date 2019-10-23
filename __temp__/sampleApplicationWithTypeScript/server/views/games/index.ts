import { handler as All } from './queries/All';
import { handler as PlayingGameOpened } from './projections/PlayingGameOpened';
import { handler as Top50 } from './queries/Top50';

export { store } from './store';
export const projections = { PlayingGameOpened };
export const queries = { All, Top50 };
