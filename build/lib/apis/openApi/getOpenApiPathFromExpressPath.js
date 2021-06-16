"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenApiPathFromExpressPath = void 0;
const getOpenApiPathFromExpressPath = function ({ expressPath }) {
    return expressPath.
        split('/').
        map((pathSegment) => {
        if (!pathSegment.startsWith(':')) {
            return pathSegment;
        }
        return `{${pathSegment.slice(1)}}`;
    }).
        join('/');
};
exports.getOpenApiPathFromExpressPath = getOpenApiPathFromExpressPath;
//# sourceMappingURL=getOpenApiPathFromExpressPath.js.map