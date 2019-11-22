import { DomainDefinition } from './DomainDefinition';
import { PackageManifest } from './PackageManifest';
import { ViewsDefinition } from './ViewsDefinition';

export interface ApplicationDefinition {
  rootDirectory: string;

  packageManifest: PackageManifest;

  domain: DomainDefinition;

  views: ViewsDefinition;
}
