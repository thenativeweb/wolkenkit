"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCommand = void 0;
const buntstift_1 = require("buntstift");
const fs_1 = __importDefault(require("fs"));
const getApplicationRoot_1 = require("../../../../common/application/getApplicationRoot");
const getBaseImageVersionsFromDockerfile_1 = require("./getBaseImageVersionsFromDockerfile");
const getVersionNumber_1 = require("./getVersionNumber");
const path_1 = __importDefault(require("path"));
const validateMode_1 = require("./validateMode");
const versions_1 = require("../../../../versions");
const verifyCommand = function () {
    return {
        name: 'verify',
        description: 'Verify versions.',
        optionDefinitions: [
            {
                name: 'mode',
                alias: 'm',
                description: 'set mode',
                parameterName: 'name',
                type: 'string',
                isRequired: false,
                defaultValue: 'error',
                validate: validateMode_1.validateMode
            }
        ],
        async handle({ options: { verbose, mode } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            try {
                const applicationRoot = await getApplicationRoot_1.getApplicationRoot({ directory: __dirname });
                const nodejsDockerfile = path_1.default.join(applicationRoot, 'docker', 'wolkenkit-nodejs', 'Dockerfile');
                const postgresDockerfile = path_1.default.join(applicationRoot, 'docker', 'wolkenkit-postgres', 'Dockerfile');
                const roboterPackageJsonPath = path_1.default.join(applicationRoot, 'node_modules', 'roboter', 'package.json');
                const roboterPackageJson = JSON.parse(await fs_1.default.promises.readFile(roboterPackageJsonPath, 'utf8'));
                const wolkenkitPackageJsonPath = path_1.default.join(applicationRoot, 'package.json');
                const wolkenkitPackageJson = JSON.parse(await fs_1.default.promises.readFile(wolkenkitPackageJsonPath, 'utf8'));
                const currentVersions = {
                    nodejs: [
                        ...(await getBaseImageVersionsFromDockerfile_1.getBaseImageVersionsFromDockerfile({
                            dockerfilePath: nodejsDockerfile,
                            baseImage: 'node'
                        })).map((imageVersion) => ({
                            source: `${path_1.default.relative(applicationRoot, nodejsDockerfile)}#${imageVersion.line}`,
                            version: getVersionNumber_1.getVersionNumber({ version: imageVersion.version })
                        })),
                        {
                            source: path_1.default.relative(applicationRoot, wolkenkitPackageJsonPath),
                            version: getVersionNumber_1.getVersionNumber({
                                version: wolkenkitPackageJson.engines.node
                            })
                        }
                    ],
                    postgres: [
                        ...(await getBaseImageVersionsFromDockerfile_1.getBaseImageVersionsFromDockerfile({
                            dockerfilePath: postgresDockerfile,
                            baseImage: 'postgres'
                        })).map((imageVersion) => ({
                            source: `${path_1.default.relative(applicationRoot, nodejsDockerfile)}#${imageVersion.line}`,
                            version: getVersionNumber_1.getVersionNumber({ version: imageVersion.version })
                        })),
                        {
                            source: 'lib/version.ts',
                            version: getVersionNumber_1.getVersionNumber({
                                version: versions_1.versions.dockerImages.postgres
                            })
                        }
                    ],
                    typescript: [
                        {
                            source: path_1.default.relative(applicationRoot, roboterPackageJsonPath),
                            version: roboterPackageJson.dependencies.typescript
                        },
                        {
                            source: 'lib/version.ts',
                            version: versions_1.versions.packages.typescript
                        }
                    ]
                };
                buntstift_1.buntstift.info(`Verifying versions...`);
                let foundInconsistentVersions = false;
                for (const [name, currentVersionsByName] of Object.entries(currentVersions)) {
                    const areVersionsDifferent = currentVersionsByName.
                        map((currentVersion) => currentVersion.version).
                        some((currentVersion) => currentVersion !== currentVersionsByName[0].version);
                    if (!areVersionsDifferent) {
                        continue;
                    }
                    foundInconsistentVersions = true;
                    buntstift_1.buntstift.list(name);
                    for (const currentVersion of currentVersionsByName) {
                        buntstift_1.buntstift.list(`'${currentVersion.version}' in '${currentVersion.source}'`, { level: 1 });
                    }
                }
                if (foundInconsistentVersions) {
                    if (mode === 'error') {
                        buntstift_1.buntstift.error('Versions do not match.');
                        stopWaiting();
                        // eslint-disable-next-line unicorn/no-process-exit
                        process.exit(1);
                    }
                    else {
                        buntstift_1.buntstift.warn('Versions do not match.');
                        return;
                    }
                }
                buntstift_1.buntstift.success('Verified versions.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to verify versions.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.verifyCommand = verifyCommand;
//# sourceMappingURL=verifyCommand.js.map