"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiDefinitions = void 0;
const getDescription_1 = require("./v2/getDescription");
const getDomainEvents_1 = require("./v2/getDomainEvents");
const getApiDefinitions = function ({ basePath }) {
    return [{
            basePath: `${basePath}/v2`,
            routes: {
                get: [
                    getDescription_1.getDescription,
                    getDomainEvents_1.getDomainEvents
                ],
                post: []
            },
            tags: ['Domain events']
        }];
};
exports.getApiDefinitions = getApiDefinitions;
//# sourceMappingURL=getApiDefinitions.js.map