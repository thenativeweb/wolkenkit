"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.infrastructureCommand = void 0;
const buntstift_1 = require("buntstift");
const getApplicationPackageJson_1 = require("../../../../common/application/getApplicationPackageJson");
const getApplicationRoot_1 = require("../../../../common/application/getApplicationRoot");
const getInfrastructureDefinition_1 = require("../../../../common/application/getInfrastructureDefinition");
const getLoggerService_1 = require("../../../../common/services/getLoggerService");
const path_1 = __importDefault(require("path"));
const errors = __importStar(require("../../../../common/errors"));
const infrastructureCommand = function () {
    return {
        name: 'infrastructure',
        description: 'Set up infrastructure.',
        optionDefinitions: [],
        async handle({ options: { verbose } }) {
            var _a, _b;
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            try {
                const applicationDirectory = await getApplicationRoot_1.getApplicationRoot({ directory: process.cwd() });
                const serverDirectory = path_1.default.join(applicationDirectory, 'build', 'server');
                const infrastructureDirectory = path_1.default.join(serverDirectory, 'infrastructure');
                const infrastructureDefinition = await getInfrastructureDefinition_1.getInfrastructureDefinition({ infrastructureDirectory });
                const packageManifest = await getApplicationPackageJson_1.getApplicationPackageJson({ directory: applicationDirectory });
                if (!((_a = packageManifest.dependencies) === null || _a === void 0 ? void 0 : _a.wolkenkit) && !((_b = packageManifest.devDependencies) === null || _b === void 0 ? void 0 : _b.wolkenkit)) {
                    buntstift_1.buntstift.info('Application not found.');
                    throw new errors.ApplicationNotFound();
                }
                buntstift_1.buntstift.info(`Setting up the infrastructure for the '${packageManifest.name}' application...`);
                await infrastructureDefinition.setupInfrastructure({
                    logger: getLoggerService_1.getLoggerService({
                        fileName: '<app>/build/server/infrastructure/setupInfrastructure',
                        packageManifest
                    })
                });
                buntstift_1.buntstift.success(`Successfully set up the infrastructure for the '${packageManifest.name}' application...`);
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the infrastructure.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.infrastructureCommand = infrastructureCommand;
//# sourceMappingURL=infrastructureCommand.js.map