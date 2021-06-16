import { RootOptions } from '../RootOptions';
export interface HealthOptions extends RootOptions {
    protocol: string;
    'host-name': string;
    'health-port'?: number;
    'health-socket'?: string;
    'base-path': string;
}
