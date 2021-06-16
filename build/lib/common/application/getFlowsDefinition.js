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
exports.getFlowsDefinition = void 0;
const exists_1 = require("../utils/fs/exists");
const fs_1 = __importDefault(require("fs"));
const isErrnoException_1 = require("../utils/isErrnoException");
const parseFlow_1 = require("../parsers/parseFlow");
const path_1 = __importDefault(require("path"));
const errors = __importStar(require("../errors"));
const getFlowsDefinition = async function ({ flowsDirectory }) {
    if (!await exists_1.exists({ path: flowsDirectory })) {
        throw new errors.DirectoryNotFound(`Directory '<app>/build/server/flows' not found.`);
    }
    const flowsDefinition = {};
    for (const flowEntry of await fs_1.default.promises.readdir(flowsDirectory, { withFileTypes: true })) {
        const flowName = path_1.default.basename(flowEntry.name, '.js'), flowPath = path_1.default.join(flowsDirectory, flowEntry.name);
        // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
        if (flowEntry.isFile() && path_1.default.extname(flowEntry.name) !== '.js') {
            continue;
        }
        if (flowEntry.isDirectory()) {
            const indexPath = path_1.default.join(flowPath, 'index.js');
            try {
                await fs_1.default.promises.access(indexPath, fs_1.default.constants.R_OK);
            }
            catch {
                throw new errors.FileNotFound(`No flow definition in '<app>/build/server/flows/${flowName}' found.`);
            }
        }
        let rawFlow;
        try {
            rawFlow = (await Promise.resolve().then(() => __importStar(require(flowPath)))).default;
        }
        catch (ex) {
            if (ex instanceof SyntaxError) {
                throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/flows/${flowName}'.`, cause: ex });
            }
            if (isErrnoException_1.isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
                throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/flows/${flowName}'.`, cause: ex });
            }
            throw new errors.FileNotFound(`No flow definition in '<app>/build/server/flows/${flowName}' found.`);
        }
        parseFlow_1.parseFlow({
            flowDefinition: rawFlow
        }).unwrapOrThrow((err) => new errors.FlowDefinitionMalformed(`Flow definition '<app>/build/server/flows/${flowName}' is malformed: ${err.message}`));
        const flowEnhancers = (rawFlow.enhancers || []);
        const enhancedFlowDefinition = flowEnhancers.reduce((flowDefinition, flowEnhancer) => flowEnhancer(flowDefinition), rawFlow);
        flowsDefinition[flowName] = enhancedFlowDefinition;
    }
    return flowsDefinition;
};
exports.getFlowsDefinition = getFlowsDefinition;
//# sourceMappingURL=getFlowsDefinition.js.map