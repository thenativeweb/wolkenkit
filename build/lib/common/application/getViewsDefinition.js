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
exports.getViewsDefinition = void 0;
const exists_1 = require("../utils/fs/exists");
const fs_1 = __importDefault(require("fs"));
const isErrnoException_1 = require("../utils/isErrnoException");
const parseView_1 = require("../parsers/parseView");
const path_1 = __importDefault(require("path"));
const errors = __importStar(require("../errors"));
const getViewsDefinition = async function ({ viewsDirectory }) {
    if (!await exists_1.exists({ path: viewsDirectory })) {
        throw new errors.DirectoryNotFound(`Directory '<app>/build/server/views' not found.`);
    }
    const viewsDefinition = {};
    for (const viewEntry of await fs_1.default.promises.readdir(viewsDirectory, { withFileTypes: true })) {
        const viewName = path_1.default.basename(viewEntry.name, '.js'), viewPath = path_1.default.join(viewsDirectory, viewEntry.name);
        // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
        if (viewEntry.isFile() && path_1.default.extname(viewEntry.name) !== '.js') {
            continue;
        }
        if (viewEntry.isDirectory()) {
            const indexPath = path_1.default.join(viewPath, 'index.js');
            try {
                await fs_1.default.promises.access(indexPath, fs_1.default.constants.R_OK);
            }
            catch {
                throw new errors.FileNotFound(`No view definition in '<app>/build/server/views/${viewName}' found.`);
            }
        }
        let rawView;
        try {
            rawView = (await Promise.resolve().then(() => __importStar(require(viewPath)))).default;
        }
        catch (ex) {
            if (ex instanceof SyntaxError) {
                throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/views/${viewName}'.`, cause: ex });
            }
            if (isErrnoException_1.isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
                throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/views/${viewName}'.`, cause: ex });
            }
            throw new errors.FileNotFound(`No view definition in '<app>/build/server/views/${viewName}' found.`);
        }
        parseView_1.parseView({
            viewDefinition: rawView
        }).unwrapOrThrow((err) => new errors.ViewDefinitionMalformed(`View definition '<app>/build/server/views/${viewName}' is malformed: ${err.message}`));
        const viewEnhancers = (rawView.enhancers || []);
        const enhancedViewDefinition = viewEnhancers.reduce((viewDefinition, viewEnhancer) => viewEnhancer(viewDefinition), rawView);
        viewsDefinition[viewName] = enhancedViewDefinition;
    }
    return viewsDefinition;
};
exports.getViewsDefinition = getViewsDefinition;
//# sourceMappingURL=getViewsDefinition.js.map