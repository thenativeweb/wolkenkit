"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiBase = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const jsonQueryParserMiddleware_1 = require("./jsonQueryParserMiddleware");
const nocache_1 = __importDefault(require("nocache"));
const streamNdjsonMiddleware_1 = require("./streamNdjsonMiddleware");
const express_1 = __importDefault(require("express"));
const getApiBase = async function ({ request, response }) {
    const api = express_1.default();
    const helmetOptions = {};
    if (request.headers.csp === false) {
        helmetOptions.contentSecurityPolicy = false;
    }
    api.use(helmet_1.default(helmetOptions));
    if (request.headers.cors) {
        api.options('*', cors_1.default({
            methods: ['GET', 'POST'],
            origin: request.headers.cors.origin,
            allowedHeaders: request.headers.cors.allowedHeaders,
            exposedHeaders: request.headers.cors.exposedHeaders,
            optionsSuccessStatus: 200
        }));
        api.use(cors_1.default({
            methods: ['GET', 'POST'],
            origin: request.headers.cors.origin,
            allowedHeaders: request.headers.cors.allowedHeaders,
            exposedHeaders: request.headers.cors.exposedHeaders,
            optionsSuccessStatus: 200
        }));
    }
    if (!response.headers.cache) {
        api.use(nocache_1.default());
    }
    if (request.query.parser.useJson) {
        api.use(jsonQueryParserMiddleware_1.jsonQueryParserMiddleware);
    }
    if (request.body.parser) {
        api.use(body_parser_1.default.json({ limit: request.body.parser.sizeLimit }));
    }
    api.use(streamNdjsonMiddleware_1.streamNdjsonMiddleware);
    return api;
};
exports.getApiBase = getApiBase;
//# sourceMappingURL=getApiBase.js.map