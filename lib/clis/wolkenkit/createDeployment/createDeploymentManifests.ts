import fs from 'fs';
import { getMicroservicePostgresManifest } from './dockerCompose/getMicroservicePostgresManifest';
import { getSingleProcessInMemoryManifest } from './dockerCompose/getSingleProcessInMemoryManifest';
import { getSingleProcessPostgresManifest } from './dockerCompose/getSingleProcessPostgresManifest';
import path from 'path';
import { stripIndent } from 'common-tags';

const createDeploymentManifests = async function ({ directory, name }: {
  directory: string;
  name: string;
}): Promise<void> {
  const deploymentFiles = [
    {
      filePath: [ 'docker-compose', 'microservice.postgres.yml' ],
      content: getMicroservicePostgresManifest({ appName: name })
    },
    {
      filePath: [ 'docker-compose', 'single-process.in-memory.yml' ],
      content: getSingleProcessInMemoryManifest({ appName: name })
    },
    {
      filePath: [ 'docker-compose', 'single-process.postgres.yml' ],
      content: getSingleProcessPostgresManifest({ appName: name })
    }
  ];

  for (const { filePath, content } of deploymentFiles) {
    const completeFilePath = path.join(directory, ...filePath);
    const fileContent = stripIndent(content);

    await fs.promises.mkdir(path.dirname(completeFilePath), { recursive: true });
    await fs.promises.writeFile(completeFilePath, fileContent, 'utf8');
  }
};

export { createDeploymentManifests };
