import { RootOptions } from '../RootOptions';

export interface CreateDeploymentOptions extends RootOptions {
  directory?: string;
  'deployment-directory': string;
  force: boolean;
  name?: string;
}
