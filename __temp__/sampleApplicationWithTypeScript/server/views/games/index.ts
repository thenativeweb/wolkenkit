import { PlayingGameOpened } from './projections/PlayingGameOpened';
import { Store } from './Store';
import * as All from './queries/All';
import * as Top50 from './queries/Top50';

export const store = new Store();
export const projections = { PlayingGameOpened };
export const queries = { All, Top50 };
