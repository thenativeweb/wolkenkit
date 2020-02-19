import fs from 'fs';
import { getApplicationRoot } from '../../common/application/getApplicationRoot';
import { PackageManifest } from '../../common/application/PackageManifest';
import path from 'path';
import { stripIndent } from 'common-tags';

const createDockerConfiguration = async function ({ directory, name }: {
  directory: string;
  name: string;
}): Promise<void> {
  const applicationRoot = await getApplicationRoot({ directory: __dirname });
  const wolkenkitPackageJsonPath = path.join(applicationRoot, 'package.json');
  const wolkenkitPackageJson: PackageManifest = JSON.parse(await fs.promises.readFile(wolkenkitPackageJsonPath, 'utf8'));

  const dockerConfiguration = [
    {
      fileName: '.dockerignore',
      content: `
        **
        !/server/**
        !/package.json
        !/package-lock.json
        !/tsconfig.json
      `
    },
    {
      fileName: 'Dockerfile',
      content: `
        FROM thenativeweb/wolkenkit:${wolkenkitPackageJson.version}

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json ./package.json
        RUN npm install --production

        ADD . .
        RUN npx wolkenkit build
      `
    },
    {
      fileName: 'docker-compose.single-process.in-memory.yaml',
      content: `
      version: '3.7'
      services:
        main:
          build: '.'
          command: 'node ./node_modules/wolkenkit/build/lib/runtimes/singleProcess/processes/main/app.js'
          environment:
            APPLICATION_DIRECTORY: '/app'
            COMMAND_QUEUE_RENEW_INTERVAL: '${String(5_000)}'
            CONCURRENT_COMMANDS: '${String(100)}'
            CORS_ORIGIN: '*'
            DOMAIN_EVENT_STORE_OPTIONS: '${JSON.stringify({})}'
            DOMAIN_EVENT_STORE_TYPE: 'InMemory'
            HEALTH_PORT: '3001'
            IDENTITY_PROVIDERS: '${JSON.stringify([])}'
            LOCK_STORE_OPTIONS: '${JSON.stringify({})}'
            LOCK_STORE_TYPE: 'InMemory'
            LOG_LEVEL: 'debug'
            PORT: '3000'
            SNAPSHOT_STRATEGY: '${JSON.stringify({ name: 'revision', configuration: { revisionLimit: 100 }})}'
          expose:
          - '3000'
          - '3001'
          image: '${name}'
          init: true
          ports:
          - '3000:3000'
          - '3001:3001'
          restart: 'always'
      `
    }
  ];

  for (const { fileName, content } of dockerConfiguration) {
    const filePath = path.join(directory, fileName);
    const fileContent = stripIndent(content);

    await fs.promises.writeFile(filePath, fileContent, 'utf8');
  }
};

export { createDockerConfiguration };
