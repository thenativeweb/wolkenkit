import { Application } from '../../../common/application/Application';
import { ReplayConfiguration } from './ReplayConfiguration';
import { Result } from 'defekt';
import * as errors from '../../../common/errors';
declare const parseReplayConfiguration: ({ application, replayConfiguration }: {
    application: Application;
    replayConfiguration: any;
}) => Result<ReplayConfiguration, errors.ReplayConfigurationInvalid>;
export { parseReplayConfiguration };
