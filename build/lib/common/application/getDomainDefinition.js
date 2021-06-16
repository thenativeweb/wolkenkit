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
exports.getDomainDefinition = void 0;
const exists_1 = require("../utils/fs/exists");
const fs_1 = __importDefault(require("fs"));
const isErrnoException_1 = require("../utils/isErrnoException");
const parseAggregate_1 = require("../parsers/parseAggregate");
const path_1 = __importDefault(require("path"));
const errors = __importStar(require("../errors"));
const getDomainDefinition = async function ({ domainDirectory }) {
    if (!await exists_1.exists({ path: domainDirectory })) {
        throw new errors.DirectoryNotFound(`Directory '<app>/build/server/domain' not found.`);
    }
    const domainDefinition = {};
    for (const contextDirectory of await fs_1.default.promises.readdir(domainDirectory, { withFileTypes: true })) {
        if (!contextDirectory.isDirectory()) {
            continue;
        }
        const contextPath = path_1.default.join(domainDirectory, contextDirectory.name);
        const contextName = contextDirectory.name;
        domainDefinition[contextName] = {};
        for (const aggregateEntry of await fs_1.default.promises.readdir(contextPath, { withFileTypes: true })) {
            const aggregateName = path_1.default.basename(aggregateEntry.name, '.js'), aggregatePath = path_1.default.join(contextPath, aggregateEntry.name);
            // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
            if (aggregateEntry.isFile() && path_1.default.extname(aggregateEntry.name) !== '.js') {
                continue;
            }
            if (aggregateEntry.isDirectory()) {
                const indexPath = path_1.default.join(aggregatePath, 'index.js');
                try {
                    await fs_1.default.promises.access(indexPath, fs_1.default.constants.R_OK);
                }
                catch {
                    throw new errors.FileNotFound(`No aggregate definition in '<app>/build/server/domain/${contextName}/${aggregateName}' found.`);
                }
            }
            let rawAggregate;
            try {
                rawAggregate = (await Promise.resolve().then(() => __importStar(require(aggregatePath)))).default;
            }
            catch (ex) {
                if (ex instanceof SyntaxError) {
                    throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/domain/${contextName}/${aggregateName}'.`, cause: ex });
                }
                if (isErrnoException_1.isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
                    throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/domain/${contextName}/${aggregateName}'.`, cause: ex });
                }
                throw new errors.FileNotFound(`No aggregate definition in '<app>/build/server/domain/${contextName}/${aggregateName}' found.`);
            }
            const aggregate = parseAggregate_1.parseAggregate({
                aggregate: rawAggregate
            }).unwrapOrThrow((err) => new errors.AggregateDefinitionMalformed(`Aggregate definition '<app>/build/server/domain/${contextName}/${aggregateName}' is malformed: ${err.message}`));
            const aggregateEnhancers = (rawAggregate.enhancers || []);
            const enhancedAggregateDefinition = aggregateEnhancers.reduce((aggregateDefinition, aggregateEnhancer) => aggregateEnhancer(aggregateDefinition), aggregate);
            domainDefinition[contextName][aggregateName] = enhancedAggregateDefinition;
        }
    }
    return domainDefinition;
};
exports.getDomainDefinition = getDomainDefinition;
//# sourceMappingURL=getDomainDefinition.js.map