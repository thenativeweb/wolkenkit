import { RootOptions } from '../RootOptions';
interface ReplayOptions extends RootOptions {
    'replay-api-protocol'?: string;
    'replay-api-host-name'?: string;
    'replay-api-port'?: number;
    'replay-api-socket'?: string;
    'replay-api-base-path'?: string;
    'domain-event-store-options': string;
    'consumer-progress-store-options': string;
    'replay-configuration': string;
    'dangerously-reevaluate': boolean;
}
export type { ReplayOptions };
