import fs from 'fs';
import path from 'path';
import { stripIndent } from 'common-tags';
import { versions } from '../../../versions';

const createDockerConfiguration = async function ({ directory }: {
  directory: string;
}): Promise<void> {
  const dockerConfiguration = [
    {
      filePath: [ '.dockerignore' ],
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
      filePath: [ 'Dockerfile' ],
      content: `
        # Build application to compile TypeScript if needed.
        FROM node:${versions.infrastructure.nodejs}-alpine as build

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
        FROM node:${versions.infrastructure.nodejs}-alpine as dependencies

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json ./.npmrc* .
        RUN npm install --production


        # Bundle the built application with the production dependencies.
        FROM node:${versions.infrastructure.nodejs}-alpine

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json .

        COPY --from=build /app/build /app/build
        COPY --from=dependencies /app/node_modules /app/node_modules
      `
    }
  ];

  for (const { filePath, content } of dockerConfiguration) {
    const completeFilePath = path.join(directory, ...filePath);
    const fileContent = stripIndent(content);

    await fs.promises.mkdir(path.dirname(completeFilePath), { recursive: true });
    await fs.promises.writeFile(completeFilePath, fileContent, 'utf8');
  }
};

export { createDockerConfiguration };
