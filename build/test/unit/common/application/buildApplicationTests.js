"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildApplication_1 = require("../../../../lib/common/application/buildApplication");
const fs_1 = __importDefault(require("fs"));
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const isolated_1 = require("isolated");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const javascriptApplicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base-uncompiled' });
const typescriptApplicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base', language: 'typescript' });
const getExpectedApplication = ({ applicationDirectory, packageName }) => ({
    rootDirectory: applicationDirectory,
    packageManifest: {
        name: packageName,
        version: '1.0.0'
    },
    domain: {
        sampleContext: {
            sampleAggregate: {
                commandHandlers: {
                    execute: {}
                },
                domainEventHandlers: {
                    executed: {},
                    succeeded: {}
                }
            }
        }
    },
    infrastructure: {
        ask: {},
        tell: {}
    },
    views: {
        sampleView: {
            queryHandlers: {
                all: {}
            }
        }
    }
});
suite('buildApplication', function () {
    this.timeout(30000);
    test('builds a JavaScript application.', async () => {
        const applicationDirectory = await isolated_1.isolated();
        shelljs_1.default.cp('-r', path_1.default.join(javascriptApplicationDirectory, '*'), applicationDirectory);
        await buildApplication_1.buildApplication({ applicationDirectory });
        const actualApplication = await loadApplication_1.loadApplication({ applicationDirectory });
        const expectedApplication = getExpectedApplication({ applicationDirectory, packageName: 'base-uncompiled' });
        assertthat_1.assert.that(actualApplication).is.atLeast(expectedApplication);
    });
    test('builds a TypeScript application.', async () => {
        const applicationDirectory = await isolated_1.isolated();
        const wolkenkitDirectory = path_1.default.join(__dirname, '..', '..', '..', '..');
        shelljs_1.default.cp('-r', path_1.default.join(typescriptApplicationDirectory, '*'), applicationDirectory);
        const packageJsonPath = path_1.default.join(applicationDirectory, 'package.json');
        const packageJsonContent = await fs_1.default.promises.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        packageJson.dependencies.wolkenkit = `file://${wolkenkitDirectory}`;
        await fs_1.default.promises.writeFile(packageJsonPath, JSON.stringify(packageJson), 'utf8');
        shelljs_1.default.exec('npm install', { cwd: applicationDirectory });
        await buildApplication_1.buildApplication({ applicationDirectory });
        const actualApplication = await loadApplication_1.loadApplication({ applicationDirectory });
        const expectedApplication = getExpectedApplication({ applicationDirectory, packageName: 'base' });
        assertthat_1.assert.that(actualApplication).is.atLeast(expectedApplication);
    });
});
//# sourceMappingURL=buildApplicationTests.js.map