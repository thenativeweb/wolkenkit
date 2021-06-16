"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDockerConfiguration = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const common_tags_1 = require("common-tags");
const versions_1 = require("../../../versions");
const createDockerConfiguration = async function ({ directory }) {
    const dockerConfiguration = [
        {
            filePath: ['.dockerignore'],
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
            filePath: ['Dockerfile'],
            content: `
        # Build application to compile TypeScript if needed.
        FROM node:${versions_1.versions.infrastructure.nodejs}-alpine as build

        RUN apk update && \\
            apk upgrade && \\
            apk add git

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json ./.npmrc* ./
        RUN npm install

        ADD . .
        RUN npx wolkenkit build


        # Install production dependencies.
        FROM node:${versions_1.versions.infrastructure.nodejs}-alpine as dependencies

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json ./.npmrc* ./
        RUN npm install --production


        # Bundle the built application with the production dependencies.
        FROM node:${versions_1.versions.infrastructure.nodejs}-alpine

        RUN mkdir /app
        WORKDIR /app

        ADD ./package.json .

        COPY --from=build /app/build /app/build
        COPY --from=dependencies /app/node_modules /app/node_modules
      `
        }
    ];
    for (const { filePath, content } of dockerConfiguration) {
        const completeFilePath = path_1.default.join(directory, ...filePath);
        const fileContent = common_tags_1.stripIndent(content);
        await fs_1.default.promises.mkdir(path_1.default.dirname(completeFilePath), { recursive: true });
        await fs_1.default.promises.writeFile(completeFilePath, fileContent, 'utf8');
    }
};
exports.createDockerConfiguration = createDockerConfiguration;
//# sourceMappingURL=createDockerConfiguration.js.map