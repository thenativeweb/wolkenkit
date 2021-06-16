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
exports.getApi = void 0;
const compression_1 = __importDefault(require("compression"));
const exists_1 = require("../../../common/utils/fs/exists");
const fs_1 = __importDefault(require("fs"));
const getApiBase_1 = require("../../base/getApiBase");
const flaschenpost_1 = require("flaschenpost");
const express_1 = __importDefault(require("express"));
const errors = __importStar(require("../../../common/errors"));
const getApi = async function ({ corsOrigin, directory }) {
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: { cors: { origin: corsOrigin } },
            body: { parser: false },
            query: { parser: { useJson: false } }
        },
        response: {
            headers: { cache: false }
        }
    });
    if (!await exists_1.exists({ path: directory })) {
        throw new errors.DirectoryNotFound(`Directory '${directory}' not found.`);
    }
    if (!(await fs_1.default.promises.stat(directory)).isDirectory()) {
        throw new errors.DirectoryNotFound(`Path '${directory}' is not a directory.`);
    }
    api.use(compression_1.default());
    api.use(flaschenpost_1.getMiddleware());
    api.use('/', express_1.default.static(directory));
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=index.js.map