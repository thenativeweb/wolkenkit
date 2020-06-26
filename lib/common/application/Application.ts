import { AskInfrastructure } from '../elements/AskInfrastructure';
import { DomainDefinition } from './DomainDefinition';
import { PackageManifest } from './PackageManifest';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { ViewsDefinition } from './ViewsDefinition';

export interface Application {
  rootDirectory: string;

  packageManifest: PackageManifest;

  domain: DomainDefinition;

  views: ViewsDefinition;

  infrastructure: AskInfrastructure & TellInfrastructure;
}
