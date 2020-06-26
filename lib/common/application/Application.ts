import { AskInfrastructure } from '../elements/AskInfrastructure';
import { DomainDefinition } from './DomainDefinition';
import { FlowsDefinition } from './FlowsDefinition';
import { PackageManifest } from './PackageManifest';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { ViewsDefinition } from './ViewsDefinition';

export interface Application {
  rootDirectory: string;

  packageManifest: PackageManifest;

  domain: DomainDefinition;

  flows: FlowsDefinition;

  infrastructure: AskInfrastructure & TellInfrastructure;

  views: ViewsDefinition;
}
