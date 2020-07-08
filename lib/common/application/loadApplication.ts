import { Application } from './Application';
import { ApplicationEnhancer } from '../../tools/ApplicationEnhancer';
import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { getDomainDefinition } from './getDomainDefinition';
import { getFlowsDefinition } from './getFlowsDefinition';
import { getInfrastructureDefinition } from './getInfrastructureDefinition';
import { getViewsDefinition } from './getViewsDefinition';
import path from 'path';
import { withSystemDomainEvents } from '../../tools/withSystemDomainEvents';

const loadApplication = async function ({ applicationDirectory }: {
  applicationDirectory: string;
}): Promise<Application> {
  if (!await exists({ path: applicationDirectory })) {
    throw new errors.ApplicationNotFound();
  }

  const packageManifestPath = path.join(applicationDirectory, 'package.json');
  const serverDirectory = path.join(applicationDirectory, 'build', 'server');

  if (!await exists({ path: packageManifestPath })) {
    throw new errors.FileNotFound(`File '<app>/package.json' not found.`);
  }
  if (!await exists({ path: serverDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build' not found.`);
  }

  const packageManifest = (await import(packageManifestPath)).default;

  const domainDirectory = path.join(serverDirectory, 'domain');
  const flowsDirectory = path.join(serverDirectory, 'flows');
  const infrastructureDirectory = path.join(serverDirectory, 'infrastructure');
  const viewsDirectory = path.join(serverDirectory, 'views');

  const domainDefinition = await getDomainDefinition({ domainDirectory });
  const infrastructureDefinition = await getInfrastructureDefinition({ infrastructureDirectory });
  const flowsDefinition = await getFlowsDefinition({ flowsDirectory });
  const viewsDefinition = await getViewsDefinition({ viewsDirectory });

  const applicationEnhancers: ApplicationEnhancer[] = [
    withSystemDomainEvents
  ];

  await infrastructureDefinition.setupInfrastructure();

  const rawApplication: Application = {
    rootDirectory: applicationDirectory,
    packageManifest,
    domain: domainDefinition,
    flows: flowsDefinition,
    infrastructure: await infrastructureDefinition.getInfrastructure(),
    views: viewsDefinition
  };

  const enhancedApplication = applicationEnhancers.reduce(
    (application, applicationEnhancer): Application =>
      applicationEnhancer(application),
    rawApplication
  );

  return enhancedApplication;
};

export { loadApplication };
