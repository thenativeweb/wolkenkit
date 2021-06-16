"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRouteToPaths = void 0;
const getOpenApiPathFromExpressPath_1 = require("./getOpenApiPathFromExpressPath");
const http_1 = __importDefault(require("http"));
const addRouteToPaths = function ({ route, method, basePath, tags, paths }) {
    const path = `/${basePath}/${getOpenApiPathFromExpressPath_1.getOpenApiPathFromExpressPath({ expressPath: route.path })}`;
    const routeObject = {
        [method]: {
            summary: route.description,
            parameters: [],
            responses: {},
            tags
        }
    };
    for (const pathSegment of route.path.split('/')) {
        if (!pathSegment.startsWith(':')) {
            continue;
        }
        routeObject[method].parameters.push({
            name: pathSegment.slice(1),
            in: 'path',
            required: true,
            type: 'string'
        });
    }
    if (route.request.query && route.request.query.properties) {
        for (const [queryParameterName, queryParameterSchema] of Object.entries(route.request.query.properties)) {
            routeObject[method].parameters.push({
                name: queryParameterName,
                in: 'query',
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                required: (route.request.query.required || []).includes(queryParameterName),
                schema: queryParameterSchema
            });
        }
    }
    if (route.request.headers && route.request.headers.properties) {
        for (const [headerName, headerSchema] of Object.entries(route.request.headers.properties)) {
            routeObject[method].parameters.push({
                name: headerName,
                in: 'header',
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                required: (route.request.headers.required || []).includes(headerName),
                schema: headerSchema
            });
        }
    }
    if (route.request.body) {
        routeObject[method].requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: route.request.body
                }
            }
        };
    }
    for (const statusCode of route.response.statusCodes) {
        routeObject[method].responses[statusCode] = {
            description: http_1.default.STATUS_CODES[statusCode]
        };
    }
    if (route.response.body) {
        let contentType = 'application/json';
        if (route.response.stream) {
            contentType = 'application/x-ndjson';
        }
        routeObject[method].responses[200].content = {
            [contentType]: {
                schema: route.response.body
            }
        };
    }
    // eslint-disable-next-line no-param-reassign
    paths[path] = routeObject;
};
exports.addRouteToPaths = addRouteToPaths;
//# sourceMappingURL=addRouteToPaths.js.map