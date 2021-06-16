"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const getApiBase_1 = require("../../../base/getApiBase");
const getAuthenticationMiddleware_1 = require("../../../base/getAuthenticationMiddleware");
const getFile_1 = require("./getFile");
const flaschenpost_1 = require("flaschenpost");
const postAddFile_1 = require("./postAddFile");
const postRemoveFile_1 = require("./postRemoveFile");
const getV2 = async function ({ application, corsOrigin, identityProviders, fileStore }) {
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: {
                cors: {
                    origin: corsOrigin,
                    allowedHeaders: ['content-type', 'x-id', 'x-name'],
                    exposedHeaders: ['content-length', 'content-type', 'content-disposition', 'x-id', 'x-name']
                }
            },
            body: { parser: false },
            query: { parser: { useJson: true } }
        },
        response: {
            headers: { cache: false }
        }
    });
    api.use(flaschenpost_1.getMiddleware());
    const authenticationMiddleware = await getAuthenticationMiddleware_1.getAuthenticationMiddleware({ identityProviders });
    api.get(`/${getFile_1.getFile.path}`, authenticationMiddleware, body_parser_1.default.json({ limit: 100000 }), getFile_1.getFile.getHandler({ application, fileStore }));
    api.post(`/${postAddFile_1.postAddFile.path}`, authenticationMiddleware, postAddFile_1.postAddFile.getHandler({ application, fileStore }));
    api.post(`/${postRemoveFile_1.postRemoveFile.path}`, authenticationMiddleware, body_parser_1.default.json({ limit: 100000 }), postRemoveFile_1.postRemoveFile.getHandler({ application, fileStore }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map