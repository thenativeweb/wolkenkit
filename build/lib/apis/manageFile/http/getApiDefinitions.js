"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiDefinitions = void 0;
const getFile_1 = require("./v2/getFile");
const postAddFile_1 = require("./v2/postAddFile");
const postRemoveFile_1 = require("./v2/postRemoveFile");
const getApiDefinitions = function ({ basePath }) {
    const apiDefinitions = [];
    const v2ApiDefinition = {
        basePath: `${basePath}/v2`,
        routes: {
            get: [
                {
                    path: getFile_1.getFile.path,
                    description: getFile_1.getFile.description,
                    request: {},
                    response: getFile_1.getFile.response
                }
            ],
            post: [
                {
                    path: postAddFile_1.postAddFile.path,
                    description: postAddFile_1.postAddFile.description,
                    request: {
                        headers: postAddFile_1.postAddFile.request.headers,
                        body: {}
                    },
                    response: postAddFile_1.postAddFile.response
                },
                {
                    path: postRemoveFile_1.postRemoveFile.path,
                    description: postRemoveFile_1.postRemoveFile.description,
                    request: {
                        body: postRemoveFile_1.postRemoveFile.request.body
                    },
                    response: postRemoveFile_1.postRemoveFile.response
                }
            ]
        },
        tags: ['Files']
    };
    apiDefinitions.push(v2ApiDefinition);
    return apiDefinitions;
};
exports.getApiDefinitions = getApiDefinitions;
//# sourceMappingURL=getApiDefinitions.js.map