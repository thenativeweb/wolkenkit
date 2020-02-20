import fs from 'fs';
import path from 'path';
import { stripIndent } from 'common-tags';
import { versions } from '../../versions';

const createDockerConfiguration = async function ({ directory, name }: {
  directory: string;
  name: string;
}): Promise<void> {
  const dockerConfiguration = [
    {
      fileName: '.dockerignore',
      content: `
        **
        !/server/**
        !/.npmrc
        !/package.json
        !/package-lock.json
        !/tsconfig.json
      `
    },
    {
      fileName: 'Dockerfile',
      content: `
        # Build application to compile TypeScript if needed.
        FROM node:${versions.nodejs}-alpine as build

        RUN apk update && \\
            apk upgrade && \\
            apk add git

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json ./.npmrc* .
        RUN npm install

        ADD . .
        RUN npx wolkenkit build


        # Install production dependencies.
        FROM node:${versions.nodejs}-alpine as dependencies

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json ./.npmrc* .
        RUN npm install --production


        # Bundle the built application with the production dependencies.
        FROM node:${versions.nodejs}-alpine

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json .

        COPY --from=build /app/build /app/build
        COPY --from=dependencies /app/node_modules /app/node_modules
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
