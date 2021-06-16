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
exports.loadApplication = void 0;
const exists_1 = require("../utils/fs/exists");
const getApplicationPackageJson_1 = require("./getApplicationPackageJson");
const getDomainDefinition_1 = require("./getDomainDefinition");
const getFlowsDefinition_1 = require("./getFlowsDefinition");
const getHooksDefinition_1 = require("./getHooksDefinition");
const getInfrastructureDefinition_1 = require("./getInfrastructureDefinition");
const getLoggerService_1 = require("../services/getLoggerService");
const getNotificationsDefinition_1 = require("./getNotificationsDefinition");
const getViewsDefinition_1 = require("./getViewsDefinition");
const path_1 = __importDefault(require("path"));
const withSystemDomainEvents_1 = require("../../tools/withSystemDomainEvents");
const errors = __importStar(require("../errors"));
const loadApplication = async function ({ applicationDirectory }) {
    if (!await exists_1.exists({ path: applicationDirectory })) {
        throw new errors.ApplicationNotFound();
    }
    const packageManifestPath = path_1.default.join(applicationDirectory, 'package.json');
    const serverDirectory = path_1.default.join(applicationDirectory, 'build', 'server');
    if (!await exists_1.exists({ path: packageManifestPath })) {
        throw new errors.FileNotFound(`File '<app>/package.json' not found.`);
    }
    if (!await exists_1.exists({ path: serverDirectory })) {
        throw new errors.DirectoryNotFound(`Directory '<app>/build' not found.`);
    }
    const packageManifest = await getApplicationPackageJson_1.getApplicationPackageJson({ directory: applicationDirectory });
    const domainDirectory = path_1.default.join(serverDirectory, 'domain');
    const flowsDirectory = path_1.default.join(serverDirectory, 'flows');
    const hooksDirectory = path_1.default.join(serverDirectory, 'hooks');
    const infrastructureDirectory = path_1.default.join(serverDirectory, 'infrastructure');
    const notificationsDirectory = path_1.default.join(serverDirectory, 'notifications');
    const viewsDirectory = path_1.default.join(serverDirectory, 'views');
    const domainDefinition = await getDomainDefinition_1.getDomainDefinition({ domainDirectory });
    const hooksDefinition = await getHooksDefinition_1.getHooksDefinition({ hooksDirectory });
    const infrastructureDefinition = await getInfrastructureDefinition_1.getInfrastructureDefinition({ infrastructureDirectory });
    const flowsDefinition = await getFlowsDefinition_1.getFlowsDefinition({ flowsDirectory });
    const notificationsDefinition = await getNotificationsDefinition_1.getNotificationsDefinition({ notificationsDirectory });
    const viewsDefinition = await getViewsDefinition_1.getViewsDefinition({ viewsDirectory });
    const applicationEnhancers = [
        withSystemDomainEvents_1.withSystemDomainEvents
    ];
    const rawApplication = {
        rootDirectory: applicationDirectory,
        packageManifest,
        domain: domainDefinition,
        flows: flowsDefinition,
        hooks: hooksDefinition,
        infrastructure: await infrastructureDefinition.getInfrastructure({
            logger: getLoggerService_1.getLoggerService({
                fileName: '<app>/build/server/infrastructure/getInfrastructure',
                packageManifest
            })
        }),
        notifications: notificationsDefinition,
        views: viewsDefinition
    };
    const enhancedApplication = applicationEnhancers.reduce((application, applicationEnhancer) => applicationEnhancer(application), rawApplication);
    return enhancedApplication;
};
exports.loadApplication = loadApplication;
//# sourceMappingURL=loadApplication.js.map