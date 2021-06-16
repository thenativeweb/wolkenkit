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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommand = void 0;
const buildApplication_1 = require("../../../common/application/buildApplication");
const buntstift_1 = require("buntstift");
const getApplicationPackageJson_1 = require("../../../common/application/getApplicationPackageJson");
const getApplicationRoot_1 = require("../../../common/application/getApplicationRoot");
const errors = __importStar(require("../../../common/errors"));
const buildCommand = function () {
    return {
        name: 'build',
        description: 'Build an application written in TypeScript.',
        optionDefinitions: [],
        async handle({ options: { verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            try {
                const applicationDirectory = await getApplicationRoot_1.getApplicationRoot({ directory: process.cwd() });
                const { name, dependencies, devDependencies } = await getApplicationPackageJson_1.getApplicationPackageJson({ directory: process.cwd() });
                if (!(dependencies === null || dependencies === void 0 ? void 0 : dependencies.wolkenkit) && !(devDependencies === null || devDependencies === void 0 ? void 0 : devDependencies.wolkenkit)) {
                    buntstift_1.buntstift.info('Application not found.');
                    throw new errors.ApplicationNotFound();
                }
                buntstift_1.buntstift.info(`Building the '${name}' application...`);
                await buildApplication_1.buildApplication({ applicationDirectory });
                buntstift_1.buntstift.success(`Built the '${name}' application.`);
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to build the application.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.buildCommand = buildCommand;
//# sourceMappingURL=buildCommand.js.map