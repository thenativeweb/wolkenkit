import * as All from './queries/All';
import * as PlayingGameOpened from './projections/PlayingGameOpened';
import * as Top50 from './queries/Top50';

export { Store } from './Store';
export const projections = { PlayingGameOpened };
export const queries = { All, Top50 };
