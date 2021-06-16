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
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const validateFlowNames_1 = require("../../../../lib/common/validators/validateFlowNames");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('validateFlowNames', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    let application;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    test('does not throw an error if well-known flow names are given.', async () => {
        assertthat_1.assert.that(() => {
            validateFlowNames_1.validateFlowNames({ flowNames: ['sampleFlow'], application });
        }).is.not.throwing();
    });
    test('throws an error if an unknown flow is given.', async () => {
        assertthat_1.assert.that(() => {
            validateFlowNames_1.validateFlowNames({
                flowNames: ['nonExistent'],
                application
            });
        }).is.throwing((ex) => ex.code === errors.FlowNotFound.code &&
            ex.message === `Flow 'nonExistent' not found.`);
    });
});
//# sourceMappingURL=validateFlowNamesTests.js.map