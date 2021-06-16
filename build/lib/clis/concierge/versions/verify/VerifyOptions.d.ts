import { VersionsOptions } from '../VersionsOptions';
export interface VerifyOptions extends VersionsOptions {
    mode: 'error' | 'warn';
}
