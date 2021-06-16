import { RootOptions } from '../RootOptions';
export interface InitOptions extends RootOptions {
    template?: string;
    language?: string;
    directory?: string;
    name?: string;
}
